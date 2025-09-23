declare module 'react-trello' {
  import type { CSSProperties, ComponentType } from 'react';

  export type TrelloCard = {
    id: string;
    title: string;
    description?: string;
    label?: string;
    metadata?: Record<string, unknown>;
    draggable?: boolean;
    hideCardDeleteIcon?: boolean;
    [key: string]: unknown;
  };

  export type TrelloLane = {
    id: string;
    title: string;
    cards: TrelloCard[];
    style?: CSSProperties;
    cardStyle?: CSSProperties;
    disallowAddingCard?: boolean;
    [key: string]: unknown;
  };

  export interface BoardData {
    lanes: TrelloLane[];
  }

  export interface BoardProps {
    data: BoardData;
    draggable?: boolean;
    cardDraggable?: boolean;
    laneDraggable?: boolean;
    editable?: boolean;
    canAddLanes?: boolean;
    hideCardDeleteIcon?: boolean;
    handleDragEnd?: (
      cardId: string,
      sourceLaneId: string,
      targetLaneId: string,
      position: number,
      cardDetails?: TrelloCard,
    ) => boolean | void | Promise<boolean | void>;
    onCardAdd?: (card: TrelloCard, laneId: string) => boolean | void | Promise<boolean | void>;
    onCardDelete?: (cardId: string, laneId: string) => boolean | void | Promise<boolean | void>;
    onCardClick?: (cardId: string, metadata?: Record<string, unknown>, laneId?: string) => void;
    onCardMoveAcrossLanes?: (
      fromLaneId: string,
      toLaneId: string,
      cardId: string,
      index: number,
    ) => void;
    style?: CSSProperties;
    laneStyle?: CSSProperties;
    cardDragClass?: string;
    components?: Record<string, unknown>;
    [key: string]: unknown;
  }

  const Board: ComponentType<BoardProps>;
  export { Board };
  export default Board;
}
