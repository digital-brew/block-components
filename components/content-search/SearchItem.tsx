import styled from '@emotion/styled';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import {
	Button,
	TextHighlight,
	Tooltip,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { getTextContent, create } from '@wordpress/rich-text';
import { RenderItemComponentProps } from './types';
import { NormalizedSuggestion } from './utils';

const ButtonStyled = styled(Button)`
	display: flex;
	text-align: left;
	width: 100%;
	justify-content: space-between;
	align-items: center;
	border-radius: 2px;
	height: auto !important;
	padding: 0.3em 0.7em;
	overflow: hidden;

	&:hover {
		/* Add opacity background to support future color changes */
		/* Reduce background from #ddd to 0.05 for text contrast  */
		background-color: rgba(0, 0, 0, 0.05);

		.block-editor-link-control__search-item-type {
			color: black;
		}
	}

	.block-editor-link-control__search-item-type {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 2px 4px;
		text-transform: capitalize;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.block-editor-link-control__search-item-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	mark {
		padding: 0 !important;
		margin: 0 !important;
	}
`;

const SearchItem: React.FC<RenderItemComponentProps> = ({
	item: suggestion,
	onSelect: onClick,
	searchTerm = '',
	id = '',
	contentTypes,
	renderType = defaultRenderItemType,
}) => {
	const showType = suggestion.type && contentTypes.length > 1;

	const richTextContent = create({ html: suggestion.title });
	const textContent = getTextContent(richTextContent);
	const titleContent = decodeEntities(textContent);

	return (
		<Tooltip text={decodeEntities(suggestion.title)}>
			<ButtonStyled
				id={id}
				onClick={onClick}
				className={`block-editor-link-control__search-item is-entity`}
				style={{
					borderRadius: '0',
					boxSizing: 'border-box',
				}}
			>
				<span className="block-editor-link-control__search-item-header">
					<span
						className="block-editor-link-control__search-item-title"
						style={{
							paddingRight: !showType ? 0 : undefined,
						}}
					>
						<TextHighlight text={titleContent} highlight={searchTerm} />
					</span>
					<span
						aria-hidden
						className="block-editor-link-control__search-item-info"
						style={{
							paddingRight: !showType ? 0 : undefined,
						}}
					>
						<Truncate numberOfLines={1} limit={55} ellipsizeMode="middle">
							{filterURLForDisplay(safeDecodeURI(suggestion.url)) || ''}
						</Truncate>
					</span>
				</span>
				{showType && (
					<span className="block-editor-link-control__search-item-type">
						{renderType(suggestion)}
					</span>
				)}
			</ButtonStyled>
		</Tooltip>
	);
};

export function defaultRenderItemType(suggestion: NormalizedSuggestion): string {
	// Rename 'post_tag' to 'tag'. Ideally, the API would return the localized CPT or taxonomy label.
	if ( suggestion.type === 'post_tag' ) {
		return 'tag';
	}

	if ( suggestion.subtype ) {
		return suggestion.subtype;
	}

	return suggestion.type;	
}

export default SearchItem;
