import styled from '@emotion/styled';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { Post, User, store as coreStore } from '@wordpress/core-data';
import { close } from '@wordpress/icons';
import { Button, __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
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

const PickedItemContainer = styled.div<{ isDragging?: boolean }>`
	position: relative;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	min-height: 36px;
	color: #1e1e1e;
	opacity: ${({ isDragging }) => (isDragging ? 0.5 : 1)};
	background: ${({ isDragging }) => (isDragging ? '#f0f0f0' : 'transparent')};
	border-radius: 2px;
	transition: background-color 0.1s linear;
	cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
	touch-action: none;

	&:hover {
		background: #f0f0f0;
	}

	.components-button.has-icon {
		min-width: 24px;
		padding: 0;
		height: 24px;
	}

	&:not(:hover) .remove-button {
		opacity: 0;
		pointer-events: none;
	}
`;

const DragHandleWrapper = styled.div<{ isDragging: boolean }>`
	display: ${({ isDragging }) => (isDragging ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	opacity: ${({ isDragging }) => (isDragging ? 1 : 0)};
	pointer-events: ${({ isDragging }) => (isDragging ? 'auto' : 'none')};
	transition: opacity 0.1s linear;
	position: absolute;
	left: 8px;
`;

const RemoveButton = styled(Button)<{ isDragging?: boolean }>`
	opacity: ${({ isDragging }) => (isDragging ? 0 : 1)};
	pointer-events: ${({ isDragging }) => (isDragging ? 'none' : 'auto')};
	transition: opacity 0.1s linear;

	&:focus {
		opacity: 1;
		pointer-events: auto;
	}
`;

const ItemContent = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-left: ${({ isDragging }: { isDragging?: boolean }) => (isDragging ? '24px' : '0')};
	transition: padding-left 0.1s linear;
`;

const ItemTitle = styled.span`
	font-size: 13px;
	line-height: 1.4;
	font-weight: 500;
	color: #1e1e1e;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const ItemURL = styled.span`
	font-size: 12px;
	line-height: 1.4;
	color: #757575;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

interface PickedItemProps {
	item: PickedItemType;
	isOrderable?: boolean;
	handleItemDelete: (deletedItem: PickedItemType) => void;
	mode: ContentSearchMode;
	id: number | string;
	isDragging?: boolean;
	positionInSet?: number;
	setSize?: number;
}

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
	isDragging = false,
	positionInSet = 1,
	setSize = 1,
}) => {
	const entityKind = getEntityKind(mode);

	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
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
	};

	if (!preparedItem) {
		return null;
	}

	return (
		<TreeGridRow level={1} positionInSet={positionInSet} setSize={setSize}>
			<PickedItemContainer
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				isDragging={isDragging}
			>
				{isOrderable && (
					<DragHandleWrapper isDragging={isDragging}>
						<DragHandle />
					</DragHandleWrapper>
				)}
				<ItemContent isDragging={isDragging}>
					<ItemTitle>{decodeEntities(preparedItem.title)}</ItemTitle>
					{preparedItem.url && (
						<ItemURL>
							{filterURLForDisplay(safeDecodeURI(preparedItem.url)) || ''}
						</ItemURL>
					)}
				</ItemContent>
				{!isDragging && (
					<RemoveButton
						className="remove-button"
						icon={close}
						size="small"
						variant="tertiary"
						isDestructive
						label={__('Remove item', '10up-block-components')}
						onClick={(e: React.MouseEvent) => {
							e.stopPropagation();
							handleItemDelete(item);
						}}
					/>
				)}
			</PickedItemContainer>
		</TreeGridRow>
	);
};

export default PickedItem;
