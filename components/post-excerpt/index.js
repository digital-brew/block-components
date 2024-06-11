import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { usePost } from '../../hooks';

export const PostExcerpt = (props) => {
	const { placeholder = __('Enter excerpt...', 'tenup'), ...rest } = props;
	const { postId, postType, isEditable } = usePost();

	const [rawExcerpt = '', setExcerpt, fullExcerpt] = useEntityProp(
		'postType',
		postType,
		'excerpt',
		postId,
	);

	if (!isEditable) {
		// eslint-disable-next-line react/no-danger
		return <p {...rest} dangerouslySetInnerHTML={{ __html: fullExcerpt?.rendered }} />;
	}

	return (
		<RichText
			tagName="p"
			placeholder={placeholder}
			value={rawExcerpt}
			onChange={setExcerpt}
			allowedFormats={[]}
			{...rest}
		/>
	);
};
