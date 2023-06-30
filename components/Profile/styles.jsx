import styled from 'styled-components';
import { Card } from 'antd/lib';

export const IMAGE_SIZE = 250;

export const BadgeCard = styled(Card)`
  width: ${IMAGE_SIZE}px;
  height: ${IMAGE_SIZE}px;

  .skeleton-image-loader {
    width: ${IMAGE_SIZE}px;
    height: ${IMAGE_SIZE}px;
    > svg {
      transform: scale(2.5);
    }
  }
`;