import {
	DndContext,
	closestCenter,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragStartEvent,
	DragOverlay,
	defaultDropAnimation,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { __experimentalTreeGrid as TreeGrid } from '@wordpress/components';
import { useCallback, useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PickedItem, { PickedItemType } from './PickedItem';
import { DraggableChip } from './DraggableChip';
import { ContentSearchMode } from '../content-search/types';

const dropAnimation = {
	...defaultDropAnimation,
	dragSourceOpacity: 0.5,
};

interface SortableListProps {
	posts: Array<PickedItemType>;
	isOrderable: boolean;
	handleItemDelete: (post: PickedItemType) => void;
	mode: ContentSearchMode;
	setPosts: (posts: Array<PickedItemType>) => void;
}

const SortableList: React.FC<SortableListProps> = ({
	posts,
	isOrderable = false,
	handleItemDelete,
	mode = 'post',
	setPosts,
}) => {
	const hasMultiplePosts = posts.length > 1;
	const [activeId, setActiveId] = useState<string | null>(null);

	const items = posts.map((item) => item.uuid);
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			setActiveId(null);

			if (active.id !== over?.id) {
				const oldIndex = posts.findIndex((post) => post.uuid === active.id);
				const newIndex = posts.findIndex((post) => post.uuid === over?.id);

				setPosts(arrayMove(posts, oldIndex, newIndex));
			}
		},
		[posts, setPosts],
	);

	const handleDragCancel = useCallback(() => {
		setActiveId(null);
	}, []);

	const activePost = useMemo(
		() => posts.find((post) => post.uuid === activeId),
		[activeId, posts],
	);

	console.log({ activePost });

	if (!hasMultiplePosts && !isOrderable) {
		return (
			<>
				{posts.map((post) => (
					<PickedItem
						isOrderable={false}
						key={post.uuid}
						handleItemDelete={handleItemDelete}
						item={post}
						mode={mode}
						id={post.uuid}
						positionInSet={1}
						setSize={1}
					/>
				))}
			</>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<TreeGrid
				className="block-editor-list-view-tree"
				aria-label={__('Selected items list')}
				onCollapseRow={() => {}}
				onExpandRow={() => {}}
			>
				<SortableContext items={items} strategy={verticalListSortingStrategy}>
					{posts.map((post, index) => (
						<PickedItem
							isOrderable={hasMultiplePosts && isOrderable}
							key={post.uuid}
							handleItemDelete={handleItemDelete}
							item={post}
							mode={mode}
							id={post.uuid}
							positionInSet={index + 1}
							setSize={posts.length}
						/>
					))}
				</SortableContext>
			</TreeGrid>
			<DragOverlay dropAnimation={dropAnimation}>
				{activeId && activePost ? <DraggableChip title={activePost.title} /> : null}
			</DragOverlay>
		</DndContext>
	);
};

export default SortableList;
