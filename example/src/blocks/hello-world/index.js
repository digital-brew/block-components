import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Placeholder } from '@wordpress/components';

import {ContentPicker} from '@10up/block-components';

const NAMESPACE = 'example';

registerBlockType( `${ NAMESPACE }/hello-world`, {
    title: __( 'Hello World', NAMESPACE ),
    description: __( 'Example Block to show the Post Picker in usage', NAMESPACE ),
    icon: 'smiley',
    category: 'common',
    example: {},
    supports: {
        html: false
    },
    attributes: {
        selectedPost: {
            type: 'object'
        }
    },
    transforms: {},
    variations: [],
    edit: (props) => {
        const {
            className,
            attributes: { selectedPost },
            setAttributes
        } = props;

        function handlePostSelection( post ) {
            setAttributes( { selectedPost: post } )
        }

        return (
            <>
            <InspectorControls>
                <PanelBody title={ __( 'Post Picker', NAMESPACE ) }>
                    { !!selectedPost &&
                        <div>selected post</div>
                    }
                    <ContentPicker 
                        label={ __( 'Select a Post or Page', NAMESPACE ) }
                        handleSelect={ handlePostSelection }
                    />
                </PanelBody>
            </InspectorControls>
            <Placeholder label={ __( 'Post Picker', NAMESPACE ) } instructions={ __( 'Use the text field so search for a post', NAMESPACE) } className={ className }>
                <ContentPicker 
                    postTypes={ [ 'page', 'post' ] }
                    label={ __( 'Select a Post or Page', NAMESPACE ) }
                    handleSelect={ handlePostSelection }
                    perPage={3}
                />
            </Placeholder>
            </>
        )
    },
    save: () => null
} );
