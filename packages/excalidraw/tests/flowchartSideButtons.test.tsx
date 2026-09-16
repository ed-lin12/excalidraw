import React from "react";

import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { Keyboard } from "./helpers/ui";
import { fireEvent, render, screen, unmountComponent } from "./test-utils";

unmountComponent();

const { h } = window;

const directions = ["up", "right", "down", "left"] as const;

describe("flowchart side buttons", () => {
  beforeEach(async () => {
    localStorage.clear();
    await render(<Excalidraw handleKeyboardGlobally />);
  });

  afterEach(() => {
    unmountComponent();
  });

  it("shows all directions and creates a styled bound node in each direction", () => {
    const source = API.createElement({
      type: "rectangle",
      x: 200,
      y: 200,
      width: 120,
      height: 80,
      backgroundColor: "#fef3c7",
      strokeColor: "#92400e",
      strokeWidth: 3,
      fillStyle: "solid",
    });

    for (const direction of directions) {
      API.setElements([source]);
      API.setSelectedElements([source]);

      expect(
        screen.getByTestId(`flowchart-create-${direction}`),
      ).not.toBeNull();

      fireEvent.click(screen.getByTestId(`flowchart-create-${direction}`));

      const createdNode = h.elements.find(
        (element) => element.type === "rectangle" && element.id !== source.id,
      );
      const bindingArrow = h.elements.find(
        (element) =>
          element.type === "arrow" &&
          element.endBinding?.elementId === createdNode?.id,
      );

      expect(createdNode).toMatchObject({
        type: "rectangle",
        backgroundColor: source.backgroundColor,
        strokeColor: source.strokeColor,
        strokeWidth: source.strokeWidth,
        fillStyle: source.fillStyle,
      });
      expect(bindingArrow).toMatchObject({
        startBinding: { elementId: source.id },
        endBinding: { elementId: createdNode?.id },
      });
    }
  });

  it("supports diamonds and records the creation as one undoable update", async () => {
    const diamond = API.createElement({
      type: "diamond",
      x: 200,
      y: 200,
      width: 120,
      height: 80,
      backgroundColor: "#dbeafe",
      strokeColor: "#1d4ed8",
    });

    unmountComponent();
    await render(
      <Excalidraw
        handleKeyboardGlobally
        initialData={{ elements: [diamond] }}
      />,
    );
    const source = h.app.scene.getNonDeletedElements()[0]!;
    API.setSelectedElements([source]);
    fireEvent.click(screen.getByTestId("flowchart-create-right"));

    expect(h.elements.filter((element) => !element.isDeleted)).toHaveLength(3);
    expect(
      h.elements.find(
        (element) => element.type === "diamond" && element.id !== diamond.id,
      ),
    ).toMatchObject({
      type: "diamond",
      backgroundColor: source.backgroundColor,
      strokeColor: source.strokeColor,
    });

    Keyboard.undo();

    expect(h.elements.filter((element) => !element.isDeleted)).toHaveLength(1);
    expect(h.elements[0]).toMatchObject({
      id: source.id,
      isDeleted: false,
    });
  });

  it("hides controls for unsupported or multiple selections", () => {
    const ellipse = API.createElement({
      type: "ellipse",
      x: 200,
      y: 200,
      width: 120,
      height: 80,
    });
    const rectangle = API.createElement({
      type: "rectangle",
      x: 400,
      y: 200,
      width: 120,
      height: 80,
    });

    API.setElements([ellipse]);
    API.setSelectedElements([ellipse]);
    expect(screen.queryByTestId("flowchart-create-right")).toBeNull();

    API.setElements([ellipse, rectangle]);
    API.setSelectedElements([ellipse, rectangle]);
    expect(screen.queryByTestId("flowchart-create-right")).toBeNull();
  });
});
