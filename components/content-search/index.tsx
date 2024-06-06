import { Spinner, NavigableMenu, Button, SearchControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import styled from '@emotion/styled';
import {useMergeRefs} from '@wordpress/compose';
import SearchItem, { Suggestion } from './SearchItem';
import { StyledComponentContext } from '../styled-components-context';

import type { QueryCache, SearchResult, ContentSearchProps } from './types';

import {
	QueryClient,
	QueryClientProvider,
	useQuery,
	useInfiniteQuery,
	QueryFunction,
  } from '@tanstack/react-query';
import { useOnClickOutside } from '../../hooks/use-on-click-outside';


const queryClient = new QueryClient();

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
	const [selectedItem, setSelectedItem] = useState<number|null>(null);
	const [isFocused, setIsFocused] = useState(false);

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
				return normalizedResults.map((item) => ({
						id: item.id,
						subtype: mode,
						title: item.name || '',
						type: mode,
						url: item.link || '',
					} as SearchResult));
			}

			return normalizedResults;
		},
		[mode, filterResults],
	);

	const clickOutsideRef = useOnClickOutside(() => {
		setIsFocused(false);
	});

	const mergedRef = useMergeRefs([searchContainer, clickOutsideRef]);

	const {
		status,
		data,
		error,
		isFetching,
		isFetchingNextPage,
		fetchNextPage,
		hasNextPage,
	  } = useInfiniteQuery(
		{
			queryKey: ['search', searchString, contentTypes.join(','), mode, perPage],
			queryFn: async ({ pageParam = 1 }) => {
				const searchQueryString = prepareSearchQuery(searchString, pageParam);
				const response = await apiFetch<Response>({
					path: searchQueryString,
					parse: false,
				});

				const totalPages = parseInt(
					( response.headers && response.headers.get('X-WP-TotalPages') ) || '0',
					10,
				);

				const results = await response.json();
				const normalizedResults = normalizeResults(results);

				const hasNextPage = totalPages > pageParam;
				const hasPreviousPage = pageParam > 1;

				return {
					results: normalizedResults,
					nextPage: hasNextPage ? pageParam + 1 : undefined,
					previousPage: hasPreviousPage ? pageParam - 1 : undefined,
				};
			},
			getNextPageParam: (lastPage) => lastPage.nextPage,
			getPreviousPageParam: (firstPage) => firstPage.previousPage,
			initialPageParam: 1
		}
	);

	const searchResults = data?.pages.map((page) => page?.results).flat() || undefined;

	const hasSearchString = !!searchString.length;
	const hasSearchResults = searchResults && !!searchResults.length;
	const hasInitialResults = fetchInitialResults && isFocused;

	return (
			<StyledNavigableMenu ref={mergedRef} onNavigate={handleOnNavigate} orientation="vertical">
				<StyledSearchControl
					value={searchString}
					onChange={(newSearchString) => {
						setSearchString(newSearchString);
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
							{status === 'pending' && <StyledSpinner onPointerEnterCapture={null} onPointerLeaveCapture={null} />}

							{!!error || (!isFetching && !hasSearchResults) && (
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
							{
								status === 'success' &&
								searchResults &&
								searchResults.map((item, index) => {
									if (!item || !item.title.length) {
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

						{hasSearchResults && hasNextPage && (
							<LoadingContainer>
								<Button onClick={() => fetchNextPage()} variant="secondary">
									{__('Load more', '10up-block-components')}
								</Button>
							</LoadingContainer>
						)}

						{isFetchingNextPage && <StyledSpinner onPointerEnterCapture={null} onPointerLeaveCapture={null} />}
					</>
				) : null}
			</StyledNavigableMenu>
	);
};

const ContentSearchWrapper: React.FC<ContentSearchProps> = (props) => {
	return (
		<StyledComponentContext cacheKey="tenup-component-content-search">
			<QueryClientProvider client={queryClient}>
				<ContentSearch {...props} />
			</QueryClientProvider>
		</StyledComponentContext>
	);
};

export { ContentSearchWrapper as ContentSearch};
