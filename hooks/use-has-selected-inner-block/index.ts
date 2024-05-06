import { useSelect } from '@wordpress/data';
import { useBlockEditContext, store as blockEditorStore } from '@wordpress/block-editor';

/**
 * useHasSelectedInnerBlock
 * Determine whether one of the inner blocks currently is selected
 */
export function useHasSelectedInnerBlock(): boolean {
	const { clientId } = useBlockEditContext();

	return useSelect(
		(select) => select(blockEditorStore).hasSelectedInnerBlock(clientId, true),
		[clientId]
	);
}
