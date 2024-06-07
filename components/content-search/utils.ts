import type { ContentSearchMode, Modify  } from "./types";
import type { WP_REST_API_User, WP_REST_API_Post, WP_REST_API_Term } from "wp-types";

interface IdentifiableObject extends Object {
	id: number;
};

interface FilterResultsArgs {
  results: WP_REST_API_User[] | WP_REST_API_Post[] | WP_REST_API_Term[];
  excludeItems: Array<IdentifiableObject>;
}

/**
 * Filters results.
 *
 * @returns Filtered results.
 */
export const filterResults = ({ results, excludeItems }: FilterResultsArgs) => {
	return results.filter((result) => {
		let keep = true;

		if (excludeItems.length) {
			keep = excludeItems.every((item) => item.id !== result.id);
		}

		return keep;
	});
};

interface PrepareSearchQueryArgs {
  keyword: string;
  page: number;
  mode: ContentSearchMode;
  perPage: number;
  contentTypes: Array<string>;
  queryFilter: (queryString: string, options: {
	perPage: number;
	page: number;
	contentTypes: Array<string>;
	mode: ContentSearchMode;
	keyword: string;
  }) => string;
}

/**
 * Prepares a search query based on the given keyword and page number.
 *
 * @returns The prepared search query.
 */
export const prepareSearchQuery = ({ keyword, page, mode, perPage, contentTypes, queryFilter }: PrepareSearchQueryArgs): string => {
	let searchQuery;

	switch (mode) {
		case 'user':
			searchQuery = `wp/v2/users/?search=${keyword}`;
			break;
		default:
			searchQuery = `wp/v2/search/?search=${keyword}&subtype=${contentTypes.join(
				',',
			)}&type=${mode}&_embed&per_page=${perPage}&page=${page}`;
			break;
	}

	return queryFilter(searchQuery, {
		perPage,
		page,
		contentTypes,
		mode,
		keyword,
	});
};

interface NormalizeResultsArgs {
  mode: ContentSearchMode;
  results: WP_REST_API_Post[] | WP_REST_API_User[] | WP_REST_API_Term[]
  excludeItems: Array<IdentifiableObject>;
}

/**
 * Depending on the mode value, this method normalizes the format
 * of the result array.
 *
 * @returns Normalized results.
 */
export const normalizeResults = ({ mode, results, excludeItems }: NormalizeResultsArgs): Array<{
	id: number;
	subtype: ContentSearchMode;
	title: string;
	type: ContentSearchMode;
	url: string;
}> => {
	const normalizedResults = filterResults({ results, excludeItems });

	return normalizedResults.map((item) => {

		let title: string;

		switch (mode) {
			case 'post':
				const postItem = item as unknown as Modify<WP_REST_API_Post, { title: string }>;
				title = postItem.title;
				break;
			case 'term':
				const termItem = item as WP_REST_API_Term;
				title = termItem.name;
				break;
			case 'user':
				const userItem = item as WP_REST_API_User;
				title = userItem.name;
				break;
		}

		return {
			id: item.id,
			subtype: mode,
			title: title,
			type: mode,
			url: item.link,
		};
	});
};
