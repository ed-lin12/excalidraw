import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import {
  getElementAbsoluteCoords,
  type LinkDirection,
} from "@excalidraw/element";

import type {
  ElementsMap,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import "./FlowchartSideButtons.scss";

import { useExcalidrawAppState } from "./App";

const getViewportBounds = (
  element: NonDeletedExcalidrawElement,
  appState: ReturnType<typeof useExcalidrawAppState>,
  elementsMap: ElementsMap,
) => {
  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
  const topLeft = sceneCoordsToViewportCoords(
    { sceneX: x1, sceneY: y1 },
    appState,
  );
  const bottomRight = sceneCoordsToViewportCoords(
    { sceneX: x2, sceneY: y2 },
    appState,
  );

  return {
    left: topLeft.x - appState.offsetLeft,
    top: topLeft.y - appState.offsetTop,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
};

export const FlowchartSideButtons = ({
  element,
  elementsMap,
  onCreate,
}: {
  element: NonDeletedExcalidrawElement;
  elementsMap: ElementsMap;
  onCreate: (direction: LinkDirection) => void;
}) => {
  const appState = useExcalidrawAppState();

  if (
    appState.contextMenu ||
    appState.newElement ||
    appState.resizingElement ||
    appState.isRotating ||
    appState.openMenu ||
    appState.viewModeEnabled ||
    appState.selectedElementsAreBeingDragged ||
    appState.activeTool.type !== "selection" ||
    (element.type !== "rectangle" && element.type !== "diamond")
  ) {
    return null;
  }

  const bounds = getViewportBounds(element, appState, elementsMap);

  const createButton = (direction: LinkDirection) => (
    <button
      aria-label={`Create flowchart node ${direction}`}
      className="flowchart-side-button"
      data-testid={`flowchart-create-${direction}`}
      onClick={(event) => {
        event.stopPropagation();
        onCreate(direction);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      type="button"
    >
      +
    </button>
  );

  return (
    <div
      aria-label="Flowchart node creation"
      className="flowchart-side-buttons"
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    >
      <div className="flowchart-side-button-container flowchart-side-button-container--up">
        {createButton("up")}
      </div>
      <div className="flowchart-side-button-container flowchart-side-button-container--right">
        {createButton("right")}
      </div>
      <div className="flowchart-side-button-container flowchart-side-button-container--down">
        {createButton("down")}
      </div>
      <div className="flowchart-side-button-container flowchart-side-button-container--left">
        {createButton("left")}
      </div>
    </div>
  );
};
