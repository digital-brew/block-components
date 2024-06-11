import { __ } from '@wordpress/i18n';
import { PostPrimaryTerm } from '../post-primary-term';

export const PostPrimaryCategory = ({
	placeholder = __('Select a category', 'tenup'),
	taxonomyName = 'category',
	isLink = true,
	...rest
}) => (
	<PostPrimaryTerm
		placeholder={placeholder}
		taxonomyName={taxonomyName}
		isLink={isLink}
		{...rest}
	/>
);
