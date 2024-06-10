import { Spinner, NavigableMenu, Button, SearchControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import styled from '@emotion/styled';
import SearchItem, { Suggestion } from './SearchItem';
import { StyledComponentContext } from '../styled-components-context';

const NAMESPACE = 'tenup-content-search';

// Equalize height of list icons to match loader in order to reduce jumping.
const listMinHeight = '46px';

const List = styled.ul`
	max-height: 350px;
	overflow-y: auto;
	list-style: none !important;
	margin: 0;
	padding: 0 !important;
`;

const StyledSpinner = styled(Spinner)`
	/* Custom styles to reduce jumping while loading the results */
	min-height: ${listMinHeight};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const LoadingContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 1em;

	button {
		/* Reduce the jumping of the width when text changes to "Loading" */
		min-width: 90px;
	}
`;

const StyledNavigableMenu = styled(NavigableMenu)`
	width: 100%;
`;

const StyledSearchControl = styled(SearchControl)`
	width: 100%;
`;

interface QueryCache {
	results: SearchResult[] | null;
	controller: null | number | AbortController;
	currentPage: number | null;
	totalPages: number | null;
}

interface SearchResult {
	id: number;
	title: string;
	url: string;
	type: string;
	subtype: string;
	link?: string;
	name?: string;
}

interface QueryArgs {
	perPage: number;
	page: number;
	contentTypes: string[];
	mode: string;
	keyword: string;
}

interface RenderItemComponentProps {
	item: Suggestion;
	onSelect: () => void;
	searchTerm?: string;
	isSelected?: boolean;
	id?: string;
	contentTypes: string[];
	renderType?: (suggestion: Suggestion) => string;
}

interface ContentSearchProps {
	onSelectItem: (item: Suggestion) => void;
	placeholder?: string;
	label?: string;
	hideLabelFromVision?: boolean;
	contentTypes?: string[];
	mode?: 'post' | 'user' | 'term';
	perPage?: number;
	queryFilter?: (query: string, args: QueryArgs) => string;
	excludeItems?: {
		id: number;
	}[];
	renderItemType?: (props: Suggestion) => string;
	renderItem?: (props: RenderItemComponentProps) => JSX.Element;
	fetchInitialResults?: boolean;
}

const ContentSearch: React.FC<ContentSearchProps> = ({
	onSelectItem = () => {
		console.log('Select!'); // eslint-disable-line no-console
	},
	placeholder = '',
	label,
	hideLabelFromVision = true,
	contentTypes = ['post', 'page'],
	mode = 'post',
	perPage = 20,
	queryFilter = (query: string) => query,
	excludeItems = [],
	renderItemType = undefined,
	renderItem: RenderItemComponent = undefined,
	fetchInitialResults,
}) => {
	const [searchString, setSearchString] = useState('');
	const [searchQueries, setSearchQueries] = useState<{ [key: string]: QueryCache }>({});
	const [selectedItem, setSelectedItem] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isFocused, setIsFocused] = useState(false);

	const mounted = useRef(true);

	const searchContainer = useRef<HTMLDivElement>(null);

	const filterResults = useCallback(
		(results: SearchResult[]) => {
			return results.filter((result: SearchResult) => {
				let keep = true;

				if (excludeItems.length) {
					keep = excludeItems.every((item) => item.id !== result.id);
				}

				return keep;
			});
		},
		[excludeItems],
	);

	/**
	 * handleSelection
	 *
	 * update the selected item in state to either the selected item or null if the
	 * selected item does not have a valid id
	 *
	 * @param {number} item item
	 */
	const handleOnNavigate = (item: number) => {
		if (item === 0) {
			setSelectedItem(null);
		}

		setSelectedItem(item);
	};

	/**
	 * handleItemSelection
	 *
	 * reset the search input & item container
	 * trigger the onSelectItem callback passed in via props
	 *
	 * @param {Suggestion} item item
	 */
	const handleItemSelection = (item: Suggestion) => {
		setSearchString('');
		setIsFocused(false);

		onSelectItem(item);
	};

	const prepareSearchQuery = useCallback(
		(keyword: string, page: number) => {
			let searchQuery;

			switch (mode) {
				case 'user':
					searchQuery = addQueryArgs('wp/v2/users', {
						search: keyword,
					});
					break;
				default:
					searchQuery = addQueryArgs('wp/v2/search', {
						search: keyword,
						subtype: contentTypes.join(','),
						type: mode,
						_embed: true,
						per_page: perPage,
						page,
					});

					break;
			}

			return queryFilter(searchQuery, {
				perPage,
				page,
				contentTypes,
				mode,
				keyword,
			});
		},
		[perPage, contentTypes, mode, queryFilter],
	);

	/**
	 * Depending on the mode value, this method normalizes the format
	 * of the result array.
	 *
	 * @param {string} mode ContentPicker mode.
	 * @param {SearchResult[]} result The array to be normalized.
	 *
	 * @returns {SearchResult[]} The normalizes array.
	 */
	const normalizeResults = useCallback(
		(result: SearchResult[] = []): SearchResult[] => {
			const normalizedResults = filterResults(result);

			if (mode === 'user') {
				return normalizedResults.map(
					(item) =>
						({
							id: item.id,
							subtype: mode,
							title: item.name || '',
							type: mode,
							url: item.link || '',
						}) as SearchResult,
				);
			}

			return normalizedResults;
		},
		[mode, filterResults],
	);

	/**
	 * handleSearchStringChange
	 *
	 * Using the keyword and the list of tags that are linked to the parent
	 * block search for posts/terms/users that match and return them to the
	 * autocomplete component.
	 *
	 * @param {string} keyword search query string
	 * @param {number} page page query string
	 */
	const handleSearchStringChange = (keyword: string, page: number) => {
		// Reset page and query on empty keyword.
		if (keyword.trim() === '') {
			setCurrentPage(1);
		}

		const preparedQuery = prepareSearchQuery(keyword, page);

		// Only do query if not cached or previously errored/cancelled.
		if (!searchQueries[preparedQuery] || searchQueries[preparedQuery].controller === 1) {
			setSearchQueries((queries) => {
				// New queries.
				const newQueries: { [key: string]: QueryCache } = {};

				// Remove errored or cancelled queries.
				Object.keys(queries).forEach((query) => {
					if (queries[query].controller !== 1) {
						newQueries[query] = queries[query];
					}
				});

				newQueries[preparedQuery] = {
					results: null,
					controller: null,
					currentPage: page,
					totalPages: null,
				};

				return newQueries;
			});
		}

		setCurrentPage(page);

		setSearchString(keyword);
	};

	const handleLoadMore = () => {
		handleSearchStringChange(searchString, currentPage + 1);
	};

	useEffect(() => {
		// Trigger initial fetch if enabled.
		if (fetchInitialResults) {
			handleSearchStringChange('', 1);
		}

		return () => {
			mounted.current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		Object.keys(searchQueries).forEach((searchQueryString) => {
			const searchQuery = searchQueries[searchQueryString];

			if (searchQueryString !== prepareSearchQuery(searchString, currentPage)) {
				if (searchQuery.controller && typeof searchQuery.controller === 'object') {
					searchQuery.controller.abort();
				}
			} else if (searchQuery.results === null && searchQuery.controller === null) {
				const controller = new AbortController();

				apiFetch<Response>({
					path: searchQueryString,
					signal: controller.signal,
					parse: false,
				})
					.then((results: Response) => {
						const totalPages = parseInt(
							(results.headers && results.headers.get('X-WP-TotalPages')) || '0',
							10,
						);

						// Parse, because we set parse to false to get the headers.
						results.json().then((results: SearchResult[]) => {
							if (mounted.current === false) {
								return;
							}
							const normalizedResults = normalizeResults(results);

							setSearchQueries((queries) => {
								const newQueries = { ...queries };

								if (typeof newQueries[searchQueryString] === 'undefined') {
									newQueries[searchQueryString] = {
										results: null,
										controller: null,
										totalPages: null,
										currentPage: null,
									};
								}

								newQueries[searchQueryString].results = normalizedResults;
								newQueries[searchQueryString].totalPages = totalPages;
								newQueries[searchQueryString].controller = 0;

								return newQueries;
							});
						});
					})
					.catch((error) => {
						// fetch_error means the request was aborted
						if (error.code !== 'fetch_error') {
							setSearchQueries((queries) => {
								const newQueries = { ...queries };

								if (typeof newQueries[searchQueryString] === 'undefined') {
									newQueries[searchQueryString] = {
										results: null,
										controller: null,
										totalPages: null,
										currentPage: null,
									};
								}

								newQueries[searchQueryString].controller = 1;
								newQueries[searchQueryString].results = [];

								return newQueries;
							});
						}
					});

				setSearchQueries((queries) => {
					const newQueries = { ...queries };

					newQueries[searchQueryString].controller = controller;

					return newQueries;
				});
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQueries, searchString, currentPage]);

	let searchResults: SearchResult[] | null = null;
	let isLoading = true;
	let showLoadMore = false;

	for (let i = 1; i <= currentPage; i++) {
		// eslint-disable-next-line no-loop-func
		Object.keys(searchQueries).forEach((searchQueryString) => {
			const searchQuery = searchQueries[searchQueryString];

			if (searchQueryString === prepareSearchQuery(searchString, i)) {
				if (searchQuery.results !== null) {
					if (searchResults === null) {
						searchResults = [];
					}

					searchResults = searchResults.concat(searchQuery.results);

					// If on last page, maybe show load more button
					if (i === currentPage) {
						isLoading = false;

						if (
							searchQuery.totalPages &&
							searchQuery.currentPage &&
							searchQuery.totalPages > searchQuery.currentPage
						) {
							showLoadMore = true;
						}
					}
				} else if (searchQuery.controller === 1 && i === currentPage) {
					isLoading = false;
					showLoadMore = false;
				}
			}
		});
	}

	if (searchResults !== null) {
		searchResults = filterResults(searchResults);
	}
	const hasSearchString = !!searchString.length;
	const hasSearchResults = searchResults && !!searchResults.length;
	const hasInitialResults = fetchInitialResults && isFocused;

	// Add event listener to close search results when clicking outside of the search container.
	useEffect(() => {
		document.addEventListener('mouseup', (e: MouseEvent) => {
			// Bail if anywhere inside search container is clicked.
			if (searchContainer.current?.contains(e.target as Node)) {
				return;
			}

			setIsFocused(false);
		});
	}, []);

	return (
		<StyledComponentContext cacheKey="tenup-component-content-search">
			<StyledNavigableMenu
				ref={searchContainer}
				onNavigate={handleOnNavigate}
				orientation="vertical"
			>
				<StyledSearchControl
					value={searchString}
					onChange={(newSearchString) => {
						handleSearchStringChange(newSearchString, 1);
					}}
					label={label}
					hideLabelFromVision={hideLabelFromVision}
					placeholder={placeholder}
					autoComplete="off"
					onFocus={() => {
						setIsFocused(true);
					}}
				/>

				{hasSearchString || hasInitialResults ? (
					<>
						<List className={`${NAMESPACE}-list`}>
							{isLoading && currentPage === 1 && (
								<StyledSpinner
									onPointerEnterCapture={null}
									onPointerLeaveCapture={null}
								/>
							)}

							{!isLoading && !hasSearchResults && (
								<li
									className={`${NAMESPACE}-list-item components-button`}
									style={{
										color: 'inherit',
										cursor: 'default',
										paddingLeft: '3px',
									}}
								>
									{__('Nothing found.', '10up-block-components')}
								</li>
							)}
							{(!isLoading || currentPage > 1) &&
								searchResults &&
								searchResults.map((item, index) => {
									if (!item.title.length) {
										return null;
									}

									const isSelected = selectedItem === index + 1;

									const selectItem = () => {
										handleItemSelection(item);
									};

									return (
										<li
											key={item.id}
											className={`${NAMESPACE}-list-item`}
											style={{
												marginBottom: '0',
											}}
										>
											{RenderItemComponent ? (
												<RenderItemComponent
													item={item}
													onSelect={selectItem}
													searchTerm={searchString}
													contentTypes={contentTypes}
													isSelected={isSelected}
													renderType={renderItemType}
												/>
											) : (
												<SearchItem
													onClick={selectItem}
													searchTerm={searchString}
													suggestion={item}
													contentTypes={contentTypes}
													isSelected={isSelected}
													renderType={renderItemType}
												/>
											)}
										</li>
									);
								})}
						</List>

						{!isLoading && hasSearchResults && showLoadMore && (
							<LoadingContainer>
								<Button onClick={handleLoadMore} variant="secondary">
									{__('Load more', '10up-block-components')}
								</Button>
							</LoadingContainer>
						)}

						{isLoading && currentPage > 1 && (
							<StyledSpinner
								onPointerEnterCapture={null}
								onPointerLeaveCapture={null}
							/>
						)}
					</>
				) : null}
			</StyledNavigableMenu>
		</StyledComponentContext>
	);
};

export { ContentSearch };
