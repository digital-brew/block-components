import styled from '@emotion/styled';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Button, __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { DragHandle } from '../drag-handle';
import { ContentSearchMode } from '../content-search/types';

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
	id,
	isDragging = false,
	positionInSet = 1,
	setSize = 1,
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
		id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

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
					<ItemTitle>{decodeEntities(item.title)}</ItemTitle>
					{item.url && (
						<ItemURL>{filterURLForDisplay(safeDecodeURI(item.url)) || ''}</ItemURL>
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
