import React from 'react';
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import { ContentPicker } from '@10up/block-components';

const PickedItemPreview = ({ item }) => {
	return (
		<a href={safeDecodeURI(item.url) || ''} target="_blank">
			{decodeEntities(item.title)}
		</a>
	)
};

export const BlockEdit = (props) => {
	const {
		attributes: {selectedPosts},
		setAttributes
	} = props;

	function handlePostSelection(posts) {
		setAttributes({ selectedPosts: posts })
	}

	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Content Picker', 'example')}>
					<ContentPicker
						label={__('Select a Post or Page', 'example')}
						contentTypes={['page', 'post']}
						onPickChange={handlePostSelection}
						fetchInitialResults
						content={selectedPosts}
						maxContentItems={5}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<Placeholder label={__('Content Picker', 'example')} instructions={__('Use the text field to search for a post', 'example')}>
					<ContentPicker
						label={__('Select a Post or Page', 'example')}
						contentTypes={['page', 'post']}
						onPickChange={handlePostSelection}
						fetchInitialResults
						content={selectedPosts}
						maxContentItems={5}
						PickedItemPreviewComponent={PickedItemPreview}
					/>
				</Placeholder>
			</div>
		</>
	)
}