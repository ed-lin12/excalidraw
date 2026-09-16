import React, { useEffect, useRef, useState } from "react";

import {
  isFlowchartNodeElement,
  type LinkDirection,
} from "@excalidraw/element";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import { t, useI18n } from "../i18n";

import { ElementCanvasButton } from "./MagicButton";
import { ArrowRightIcon, PlusIcon } from "./icons";

import "./FlowchartAddStep.scss";

import type { AppClassProperties } from "../types";

const directionLabels: Record<LinkDirection, string> = {
  up: "Up",
  right: "Right",
  down: "Down",
  left: "Left",
};

const directionTransforms: Record<LinkDirection, string> = {
  up: "rotate(-90deg)",
  right: "none",
  down: "rotate(90deg)",
  left: "rotate(180deg)",
};

const DirectionIcon = ({ direction }: { direction: LinkDirection }) => (
  <span
    className="flowchart-add-step__direction-icon"
    style={{ transform: directionTransforms[direction] }}
  >
    {ArrowRightIcon}
  </span>
);

export const FlowchartAddStep = ({
  app,
  element,
}: {
  app: AppClassProperties;
  element: NonDeletedExcalidrawElement;
}) => {
  const { langCode } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const ownerDocument = app.ownerDocument;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    ownerDocument.addEventListener("pointerdown", handlePointerDown);
    ownerDocument.addEventListener("keydown", handleKeyDown);
    return () => {
      ownerDocument.removeEventListener("pointerdown", handlePointerDown);
      ownerDocument.removeEventListener("keydown", handleKeyDown);
    };
  }, [app.ownerDocument, isOpen]);

  if (!isFlowchartNodeElement(element)) {
    return null;
  }

  const handleDirection = (direction: LinkDirection) => {
    setIsOpen(false);
    app.flowchart.addNode(element, direction);
  };

  return (
    <div
      ref={containerRef}
      className="flowchart-add-step"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ElementCanvasButton
        title="Add step"
        icon={PlusIcon}
        checked={isOpen}
        onChange={() => setIsOpen((open) => !open)}
      />
      {isOpen && (
        <div
          className="flowchart-add-step__picker"
          role="group"
          aria-label="Add connected step"
          key={langCode}
        >
          <div className="flowchart-add-step__label">Add step</div>
          <div className="flowchart-add-step__grid">
            <span />
            <DirectionButton direction="up" onSelect={handleDirection} />
            <span />
            <DirectionButton direction="left" onSelect={handleDirection} />
            <span className="flowchart-add-step__grid-center">{PlusIcon}</span>
            <DirectionButton direction="right" onSelect={handleDirection} />
            <span />
            <DirectionButton direction="down" onSelect={handleDirection} />
            <span />
          </div>
          <div className="flowchart-add-step__hint">
            Choose where to connect the next shape
          </div>
        </div>
      )}
    </div>
  );
};

const DirectionButton = ({
  direction,
  onSelect,
}: {
  direction: LinkDirection;
  onSelect: (direction: LinkDirection) => void;
}) => (
  <button
    type="button"
    className="flowchart-add-step__direction"
    aria-label={`${t("labels.addStep")} ${directionLabels[direction]}`}
    title={`${t("labels.addStep")} ${directionLabels[direction]}`}
    data-testid={`flowchart-add-step-${direction}`}
    onClick={() => onSelect(direction)}
  >
    <DirectionIcon direction={direction} />
  </button>
);
