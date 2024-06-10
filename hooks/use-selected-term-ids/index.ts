import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export const useSelectedTermIds = (taxonomyName: string) => {
	return useSelect(
		(select) => {
			const { getTaxonomy, hasFinishedResolution } = select(coreStore);
			const taxonomyObject = getTaxonomy(taxonomyName);
			const hasResolvedTaxonomyObject: boolean = hasFinishedResolution('getTaxonomy', [
				taxonomyName,
			]);
			const { getEditedPostAttribute } = select(editorStore);

			const selectedTermIds: Array<number> | undefined = getEditedPostAttribute(
				taxonomyObject?.rest_base,
			);

			return [selectedTermIds, hasResolvedTaxonomyObject] as const;
		},
		[taxonomyName],
	);
};
