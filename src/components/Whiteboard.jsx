import React, { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";

function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const canvasContainerRef = useRef(null); // Ref for the parent div
  const [canvasReady, setCanvasReady] = useState(false);
  const [currentTool, setCurrentTool] = useState("select");
  const currentToolRef = useRef(currentTool);
  const drawingShapeRef = useRef(null);
  const startPosRef = useRef(null);
  const isPanningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Update currentToolRef whenever currentTool changes
  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  // Toggle drawing mode and selection based on current tool
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.isDrawingMode = currentTool === "pencil";
      fabricCanvas.current.freeDrawingBrush.width = 2;
      fabricCanvas.current.selection =
        currentTool === "select" || currentTool === "pencil";
    }
  }, [currentTool]);

  // Initialize canvas and set up event listeners
  useEffect(() => {
    const CANVAS_WIDTH = 5000; // Large canvas width
    const CANVAS_HEIGHT = 5000; // Large canvas height

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    // Center the scroll position of the parent div
    if (canvasContainerRef.current) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const canvasCenterX = CANVAS_WIDTH / 2;
      const canvasCenterY = CANVAS_HEIGHT / 2;
      const viewportCenterX = viewportWidth / 2;
      const viewportCenterY = viewportHeight / 2;

      // Set the scroll position to center the canvas
      canvasContainerRef.current.scrollLeft = canvasCenterX - viewportCenterX;
      canvasContainerRef.current.scrollTop = canvasCenterY - viewportCenterY;
    }

    // Mouse down handler: Start creating shapes or panning
    const onMouseDown = (options) => {
      if (isPanningRef.current) {
        isDraggingRef.current = true;
        lastPosRef.current = { x: options.e.clientX, y: options.e.clientY };
        return;
      }

      const pointer = fabricCanvas.current.getPointer(options.e);

      if (currentToolRef.current === "rectangle") {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 2,
        });
        fabricCanvas.current.add(rect);
        drawingShapeRef.current = rect;
        startPosRef.current = pointer;
      } else if (currentToolRef.current === "circle") {
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          originX: "center",
          originY: "center",
          radius: 0,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 2,
        });
        fabricCanvas.current.add(circle);
        drawingShapeRef.current = circle;
        startPosRef.current = pointer;
      } else if (currentToolRef.current === "line") {
        const line = new fabric.Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: "black",
            strokeWidth: 2,
          }
        );
        fabricCanvas.current.add(line);
        drawingShapeRef.current = line;
        startPosRef.current = pointer;
      }
    };

    // Mouse move handler: Update shape dimensions or pan
    const onMouseMove = (options) => {
      if (isPanningRef.current && isDraggingRef.current) {
        const e = options.e;
        const deltaX = e.clientX - lastPosRef.current.x;
        const deltaY = e.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        fabricCanvas.current.relativePan(new fabric.Point(deltaX, deltaY));
        return;
      }

      if (!drawingShapeRef.current) return;
      const pointer = fabricCanvas.current.getPointer(options.e);
      const shape = drawingShapeRef.current;

      if (currentToolRef.current === "rectangle") {
        const left = Math.min(startPosRef.current.x, pointer.x);
        const top = Math.min(startPosRef.current.y, pointer.y);
        const width = Math.abs(startPosRef.current.x - pointer.x);
        const height = Math.abs(startPosRef.current.y - pointer.y);
        shape.set({ left, top, width, height });
      } else if (currentToolRef.current === "circle") {
        const dx = pointer.x - startPosRef.current.x;
        const dy = pointer.y - startPosRef.current.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        shape.set({ radius });
      } else if (currentToolRef.current === "line") {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }
      fabricCanvas.current.renderAll();
    };

    // Mouse up handler: Finalize shape creation or stop panning
    const onMouseUp = () => {
      drawingShapeRef.current = null;
      startPosRef.current = null;
      isDraggingRef.current = false;
    };

    // Handle keyboard events for panning and deletion
    const handleKeyDown = (e) => {
      if (e.key === " ") {
        if (e.target === document.body) e.preventDefault();
        isPanningRef.current = true;
        fabricCanvas.current.setCursor("grab");
      } else if (e.key === "Delete" && e.target.tagName.toLowerCase() !== "input") {
        const activeObjects = fabricCanvas.current.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => fabricCanvas.current.remove(obj));
          fabricCanvas.current.discardActiveObject();
          fabricCanvas.current.renderAll();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " ") {
        isPanningRef.current = false;
        isDraggingRef.current = false;
        fabricCanvas.current.setCursor("default");
      }
    };

    // Attach event listeners
    fabricCanvas.current.on("mouse:down", onMouseDown);
    fabricCanvas.current.on("mouse:move", onMouseMove);
    fabricCanvas.current.on("mouse:up", onMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    setCanvasReady(true);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      if (fabricCanvas.current) {
        fabricCanvas.current.off("mouse:down");
        fabricCanvas.current.off("mouse:move");
        fabricCanvas.current.off("mouse:up");
        fabricCanvas.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative h-screen bg-gray-100 overflow-auto">
      {/* Toolbar - Fixed at the top */}
      {canvasReady && (
        <div className="fixed top-0 left-0 w-full z-10">
          <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
        </div>
      )}
      {/* Canvas Container with Scrollbars */}
      <div
        ref={canvasContainerRef}
        className="absolute top-0 left-0 w-full h-full overflow-auto no-scrollbar"
      >
        <canvas ref={canvasRef} />
      </div>
      {/* Properties Panel - Fixed on the left */}
      {canvasReady && (
        <div className="fixed top-0 left-0 h-full w-64 z-10">
          <PropertiesPanel canvas={fabricCanvas.current} />
        </div>
      )}
    </div>
  );
}

export default Whiteboard;