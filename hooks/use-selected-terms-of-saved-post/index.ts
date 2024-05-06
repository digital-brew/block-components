import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { WP_REST_API_Term } from 'wp-types';

export const useSelectedTermsOfSavedPost = (taxonomyName: string, postId: number | string) => {
	return useSelect(
		(select) => {
			const { getEntityRecords, hasFinishedResolution } = select(coreStore);

			const selectedTermsQuery = [
				'taxonomy',
				taxonomyName,
				{
					per_page: -1,
					post: postId,
				},
			] as const;

			const terms = getEntityRecords<WP_REST_API_Term>(...selectedTermsQuery);
			const hasResolvedTerms: boolean = hasFinishedResolution('getEntityRecords', selectedTermsQuery);

			return [terms, hasResolvedTerms ] as const;
		},
		[taxonomyName, postId],
	);
};
