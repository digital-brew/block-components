import { useMemo } from '@wordpress/element';
import { PostContext as PostContextContext } from './context';

export const PostContext = (props) => {
	const { children, postId = null, postType = null, isEditable = null } = props;

	const value = useMemo(
		() => ({
			postId,
			postType,
			isEditable,
		}),
		[postId, postType, isEditable],
	);

	return <PostContextContext.Provider value={value}>{children}</PostContextContext.Provider>;
};
