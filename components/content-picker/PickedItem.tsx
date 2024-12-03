import styled from '@emotion/styled';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { Post, User, store as coreStore } from '@wordpress/core-data';
import { DragHandle } from '../drag-handle';
import { ContentSearchMode } from '../content-search/types';

type Term = {
	count: number;
	description: string;
	id: number;
	link: string;
	meta: { [key: string]: unknown };
	name: string;
	parent: number;
	slug: string;
	taxonomy: string;
};

const StyledCloseButton = styled('button')`
	display: block;
	padding: 2px 8px 6px 8px;
	margin-left: auto;
	font-size: 2em;
	cursor: pointer;
	border: none;
	background-color: transparent;

	&:hover {
		background-color: #ccc;
	}
`;

function getEntityKind(mode: ContentSearchMode) {
	let type;
	switch (mode) {
		case 'post':
			type = 'postType' as const;
			break;
		case 'user':
			type = 'root' as const;
			break;
		default:
			type = 'taxonomy' as const;
			break;
	}

	return type;
}

export type PickedItemType = {
	id: number;
	type: string;
	uuid: string;
	title: string;
	url: string;
};

interface PickedItemProps {
	item: PickedItemType;
	isOrderable?: boolean;
	handleItemDelete: (deletedItem: PickedItemType) => void;
	mode: ContentSearchMode;
	id: number | string;
}

const PickedItemContainer = styled.span`
	&&& {
		align-items: flex-start;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
`;

/**
 * PickedItem
 *
 * @param {PickedItemProps} props react props
 * @returns {*} React JSX
 */
const PickedItem: React.FC<PickedItemProps> = ({
	item,
	isOrderable = false,
	handleItemDelete,
	mode,
	id,
}) => {
	const entityKind = getEntityKind(mode);

	const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
		id,
	});

	// This will return undefined while the item data is being fetched. If the item comes back
	// empty, it will return null, which is handled in the effect below.
	const preparedItem = useSelect(
		(select) => {
			// @ts-ignore-next-line - The WordPress types are missing the hasFinishedResolution method.
			const { getEntityRecord, hasFinishedResolution } = select(coreStore);

			const getEntityRecordParameters = [entityKind, item.type, item.id] as const;
			const result = getEntityRecord<Post | Term | User>(...getEntityRecordParameters);

			if (result) {
				let newItem: Partial<PickedItemType>;

				if (mode === 'post') {
					const post = result as Post;
					newItem = {
						title: post.title.rendered,
						url: post.link,
						id: post.id,
						type: post.type,
					};
				} else if (mode === 'user') {
					const user = result as User;
					newItem = {
						title: user.name,
						url: user.link,
						id: user.id,
						type: 'user',
					};
				} else {
					const taxonomy = result as Term;
					newItem = {
						title: taxonomy.name,
						url: taxonomy.link,
						id: taxonomy.id,
						type: taxonomy.taxonomy,
					};
				}

				if (item.uuid) {
					newItem.uuid = item.uuid;
				}

				return newItem as PickedItemType;
			}

			if (hasFinishedResolution('getEntityRecord', getEntityRecordParameters)) {
				return null;
			}

			return undefined;
		},
		[item.id, entityKind],
	);

	// If `getEntityRecord` did not return an item, pass it to the delete callback.
	useEffect(() => {
		if (preparedItem === null) {
			handleItemDelete(item);
		}
	}, [item, handleItemDelete, preparedItem]);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		border: isDragging ? '2px dashed #ddd' : '2px dashed transparent',
		paddingTop: '10px',
		paddingBottom: '10px',
		display: 'flex',
		alignItems: 'center',
		paddingLeft: isOrderable ? '3px' : '8px',
	};

	const normalizedItemType = item?.type ? item.type : 'post';
	const className = `block-editor-link-control__search-item is-entity is-type-${normalizedItemType}`;

	if (!preparedItem) {
		return null;
	}

	return (
		<li className={className} ref={setNodeRef} style={style}>
			{isOrderable ? <DragHandle {...attributes} {...listeners} /> : ''}
			<PickedItemContainer className="block-editor-link-control__search-item-header">
				<span className="block-editor-link-control__search-item-title">
					{decodeEntities(preparedItem.title)}
				</span>
				<span aria-hidden className="block-editor-link-control__search-item-info">
					{filterURLForDisplay(safeDecodeURI(preparedItem.url)) || ''}
				</span>
			</PickedItemContainer>

			<StyledCloseButton
				type="button"
				onClick={() => {
					handleItemDelete(preparedItem);
				}}
				aria-label={__('Delete item', '10up-block-components')}
			>
				&times;
			</StyledCloseButton>
		</li>
	);
};

export default PickedItem;
