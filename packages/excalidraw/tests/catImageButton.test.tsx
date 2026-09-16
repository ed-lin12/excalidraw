import React from "react";
import { vi } from "vitest";

import { Excalidraw } from "../index";

import { fireEvent, render, screen, unmountComponent } from "./test-utils";

const { h } = window;

describe("one-click cat image", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();

    await render(<Excalidraw handleKeyboardGlobally />);
  });

  afterEach(() => {
    unmountComponent();
  });

  it("passes the embedded SVG to the existing image insertion flow", () => {
    const insertImages = vi
      .spyOn(h.app as any, "insertImages")
      .mockResolvedValue(undefined);

    fireEvent.click(screen.getByTestId("add-cat-button"));

    expect(insertImages).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: "cat.svg",
          type: "image/svg+xml",
        }),
      ],
      expect.any(Number),
      expect.any(Number),
    );
  });
});
