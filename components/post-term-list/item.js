import { useContext } from '@wordpress/element';
import { PostTermContext } from './context';

export const ListItem = (props) => {
	const { tagName: TagName = 'li', children, ...rest } = props;

	return <TagName {...rest}>{children}</TagName>;
};

export const TermLink = (props) => {
	const { link, name } = useContext(PostTermContext);

	return (
		<a href={link} inert="true" {...props}>
			{name}
		</a>
	);
};
