import type { Suggestion } from './SearchItem';

export interface QueryCache {
	results: SearchResult[] | null;
	controller: null | number | AbortController;
	currentPage: number | null;
	totalPages: number | null;
}

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
	contentTypes: string[];
	mode: string;
	keyword: string;
}

export interface RenderItemComponentProps {
	item: Suggestion;
	onSelect: () => void;
	searchTerm?: string;
	isSelected?: boolean;
	id?: string;
	contentTypes: string[];
	renderType?: (suggestion: Suggestion) => string;
}

export interface ContentSearchProps {
	onSelectItem: (item: Suggestion) => void;
	placeholder?: string;
	label?: string;
	hideLabelFromVision?: boolean;
	contentTypes?: string[];
	mode?: 'post' | 'user' | 'term';
	perPage?: number;
	queryFilter?: (query: string, args: QueryArgs) => string;
	excludeItems?: {
		id: number;
	}[];
	renderItemType?: (props: Suggestion) => string;
	renderItem?: (props: RenderItemComponentProps) => JSX.Element;
	fetchInitialResults?: boolean;
}
