import { Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styled from '@emotion/styled';
import { DragHandle } from '../drag-handle';

const ChipWrapper = styled.div`
	pointer-events: none;
`;

const Chip = styled.div`
	background: #1e1e1e;
	opacity: 0.9;
	border-radius: 2px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	color: #fff;
	display: inline-flex;
	margin: 0;
	padding: 8px;
	font-size: 13px;
	line-height: 1.4;
	white-space: nowrap;

	svg {
		fill: currentColor;
	}
`;

interface DraggableChipProps {
	title: string;
}

export const DraggableChip = (props: DraggableChipProps) => {
	let { title = __('Moving 1 item', '10up-block-components') } = props;

	if (!title) {
		title = __('Moving 1 item', '10up-block-components');
	}

	return (
		<ChipWrapper>
			<Chip data-testid="draggable-chip">
				<Flex justify="center" align="center" gap={4}>
					<FlexItem>{title}</FlexItem>
					<DragHandle />
				</Flex>
			</Chip>
		</ChipWrapper>
	);
};
