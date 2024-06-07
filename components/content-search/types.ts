import type {
	WP_REST_API_User,
	WP_REST_API_Post,
	WP_REST_API_Term,
} from 'wp-types';
import type { Suggestion } from './SearchItem';

export interface SearchResult {
	id: number;
	title: string;
	url: string;
	type: string;
	subtype: string;
	link?: string;
	name?: string;
}

export interface QueryArgs {
	perPage: number;
	page: number;
	contentTypes: Array<string>;
	mode: ContentSearchMode;
	keyword: string;
}

export interface RenderItemComponentProps {
	item: Suggestion;
	onSelect: () => void;
	searchTerm?: string;
	isSelected?: boolean;
	id?: string;
	contentTypes: Array<string>;
	renderType?: (suggestion: Suggestion) => string;
}

export type ContentSearchMode = 'post' | 'user' | 'term';

export interface ContentSearchProps {
	onSelectItem: (item: Suggestion) => void;
	placeholder?: string;
	label?: string;
	hideLabelFromVision?: boolean;
	contentTypes?: Array<string>;
	mode?: ContentSearchMode;
	perPage?: number;
	queryFilter?: (query: string, args: QueryArgs) => string;
	excludeItems?: {
		id: number;
	}[];
	renderItemType?: (props: Suggestion) => string;
	renderItem?: (props: RenderItemComponentProps) => JSX.Element;
	fetchInitialResults?: boolean;
}

export type Modify<T, R> = Omit<T, keyof R> & R;
