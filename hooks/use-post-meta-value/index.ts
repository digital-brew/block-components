import { useEntityProp } from '@wordpress/core-data';
import { usePost } from '../use-post';

export const usePostMetaValue = (metaKey: string) => {
	const { postId, postType } = usePost();
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta', postId as string);

	if (!meta || !metaKey || !Object.prototype.hasOwnProperty.call(meta, metaKey)) {
		return [undefined, () => {}];
	}

	const metaValue = meta[metaKey];
	const setMetaValue = (newValue: any) => {
		setMeta({
			...meta,
			[metaKey]: newValue,
		});
	};

	return [metaValue, setMetaValue] as const;
};
