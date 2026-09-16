import { KEYS, reseed } from "@excalidraw/common";

import { CaptureUpdateAction, getFlowchartHandles } from "@excalidraw/element";

import type {
  ExcalidrawArrowElement,
  ExcalidrawFlowchartNodeElement,
  NonDeleted,
  NonDeletedExcalidrawElement,
  Ordered,
} from "@excalidraw/element/types";

import { Excalidraw, sceneCoordsToViewportCoords } from "../index";

import { API } from "./helpers/api";
import { Keyboard, Pointer } from "./helpers/ui";
import {
  fireEvent,
  GlobalTestState,
  mockBoundingClientRect,
  render,
  restoreOriginalGetBoundingClientRect,
  unmountComponent,
} from "./test-utils";

unmountComponent();

const { h } = window;
const mouse = new Pointer("mouse");

type FlowchartNodeType = "rectangle" | "diamond";

const sceneElements = (): readonly Ordered<NonDeletedExcalidrawElement>[] =>
  h.app.scene.getNonDeletedElements();

const getElement = (id: string) => {
  const element = sceneElements().find((element) => element.id === id);
  if (!element) {
    throw new Error(`Element ${id} not found`);
  }
  return element;
};

const getFlowchartElement = (id: string) => {
  const element = sceneElements().find(
    (element): element is Ordered<NonDeleted<ExcalidrawFlowchartNodeElement>> =>
      element.id === id &&
      (element.type === "rectangle" || element.type === "diamond"),
  );
  if (!element) {
    throw new Error(`Flowchart element ${id} not found`);
  }
  return element;
};

const createSourceNode = (type: FlowchartNodeType) =>
  API.createElement({
    type,
    id: `source-${type}`,
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  }) as NonDeleted<ExcalidrawFlowchartNodeElement>;

const getHandleCenter = (
  node: ExcalidrawFlowchartNodeElement,
  direction: "right" | "left" | "up" | "down" = "right",
) => {
  const [x, y, width, height] = getFlowchartHandles(node, h.state.zoom)[
    direction
  ]!;

  return sceneCoordsToViewportCoords(
    {
      sceneX: x + width / 2,
      sceneY: y + height / 2,
    },
    h.state,
  );
};

const beginDirectionalCreation = (
  node: NonDeleted<ExcalidrawFlowchartNodeElement>,
) => {
  API.setSelectedElements([node]);
  const { x, y } = getHandleCenter(node);
  mouse.downAt(x, y);
  expect(h.app.flowchart.pendingNodes).toHaveLength(2);
};

const finishDirectionalCreation = () => {
  mouse.upAt();
};

const getCreatedElements = (
  source: NonDeleted<ExcalidrawFlowchartNodeElement>,
) => {
  const node = sceneElements().find(
    (element): element is Ordered<NonDeleted<ExcalidrawFlowchartNodeElement>> =>
      element.id !== source.id &&
      (element.type === "rectangle" || element.type === "diamond") &&
      element.type === source.type,
  );
  const arrow = sceneElements().find(
    (element): element is Ordered<NonDeleted<ExcalidrawArrowElement>> =>
      element.type === "arrow",
  );

  if (!node || !arrow) {
    throw new Error("Expected flowchart node and arrow to be created");
  }

  return { node, arrow };
};

const expectBindings = (
  source: ExcalidrawFlowchartNodeElement,
  node: ExcalidrawFlowchartNodeElement,
  arrow: ExcalidrawArrowElement,
) => {
  expect(arrow.startBinding).toMatchObject({ elementId: source.id });
  expect(arrow.endBinding).toMatchObject({ elementId: node.id });
  expect(source.boundElements).toEqual(
    expect.arrayContaining([{ id: arrow.id, type: "arrow" }]),
  );
  expect(node.boundElements).toEqual(
    expect.arrayContaining([{ id: arrow.id, type: "arrow" }]),
  );
};

beforeAll(() => {
  mockBoundingClientRect();
});

afterAll(() => {
  restoreOriginalGetBoundingClientRect();
});

beforeEach(async () => {
  localStorage.clear();
  reseed(7);
  mouse.reset();
  await render(<Excalidraw handleKeyboardGlobally={true} />);
});

describe("directional flowchart handles", () => {
  it.each<FlowchartNodeType>(["rectangle", "diamond"])(
    "commits a connected %s and arrow on pointerup",
    (type) => {
      const source = createSourceNode(type);
      API.setElements([source]);

      beginDirectionalCreation(source);
      finishDirectionalCreation();

      const { node, arrow } = getCreatedElements(source);
      expect(node.type).toBe(type);
      expectBindings(getFlowchartElement(source.id), node, arrow);
    },
  );

  it.each<FlowchartNodeType>(["rectangle", "diamond"])(
    "does not commit a %s after Escape followed by pointerup",
    (type) => {
      const source = createSourceNode(type);
      API.setElements([source]);

      beginDirectionalCreation(source);
      Keyboard.keyPress(KEYS.ESCAPE);
      finishDirectionalCreation();

      expect(sceneElements()).toEqual([
        expect.objectContaining({ id: source.id }),
      ]);
      expect(h.app.flowchart.pendingNodes).toBeNull();
      expect(getElement(source.id).boundElements).toBeNull();
    },
  );

  it.each<FlowchartNodeType>(["rectangle", "diamond"])(
    "does not commit a %s on pointercancel",
    (type) => {
      const source = createSourceNode(type);
      API.setElements([source]);

      beginDirectionalCreation(source);
      fireEvent.pointerCancel(GlobalTestState.interactiveCanvas, {
        pointerId: 1,
        pointerType: "mouse",
      });
      fireEvent.pointerUp(GlobalTestState.interactiveCanvas, {
        pointerId: 1,
        pointerType: "mouse",
      });

      expect(sceneElements()).toEqual([
        expect.objectContaining({ id: source.id }),
      ]);
      expect(h.app.flowchart.pendingNodes).toBeNull();
      expect(getElement(source.id).boundElements).toBeNull();
    },
  );

  it.each<FlowchartNodeType>(["rectangle", "diamond"])(
    "restores %s and arrow bindings through undo and redo",
    (type) => {
      const source = createSourceNode(type);
      API.updateScene({
        elements: [source],
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      beginDirectionalCreation(source);
      finishDirectionalCreation();

      const { node, arrow } = getCreatedElements(source);
      expectBindings(getFlowchartElement(source.id), node, arrow);

      Keyboard.undo();
      expect(sceneElements()).toHaveLength(1);
      expect(getFlowchartElement(source.id).boundElements).toEqual([]);

      Keyboard.redo();
      const restoredSource = getFlowchartElement(source.id);
      const restored = getCreatedElements(restoredSource);
      expectBindings(restoredSource, restored.node, restored.arrow);
    },
  );

  it("keeps a source label on the source and leaves the new node unlabeled", () => {
    const source = API.createElement({
      type: "rectangle",
      id: "source-rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      boundElements: [{ id: "source-label", type: "text" }],
    }) as NonDeleted<ExcalidrawFlowchartNodeElement>;
    const sourceLabel = API.createElement({
      type: "text",
      id: "source-label",
      text: "Source",
      width: 60,
      height: 20,
      containerId: source.id,
    });
    API.setElements([source, sourceLabel]);

    beginDirectionalCreation(source);
    finishDirectionalCreation();

    const { node, arrow } = getCreatedElements(source);
    const restoredSource = getFlowchartElement(source.id);
    const label = getElement(sourceLabel.id);

    expect(label).toMatchObject({
      id: sourceLabel.id,
      type: "text",
      text: "Source",
      containerId: source.id,
    });
    expect(restoredSource.boundElements).toEqual(
      expect.arrayContaining([
        { id: sourceLabel.id, type: "text" },
        { id: arrow.id, type: "arrow" },
      ]),
    );
    expect(node.boundElements).toEqual([{ id: arrow.id, type: "arrow" }]);
    expect(
      sceneElements().some(
        (element) => element.type === "text" && element.containerId === node.id,
      ),
    ).toBe(false);
  });
});
