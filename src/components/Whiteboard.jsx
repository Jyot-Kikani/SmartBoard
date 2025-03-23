import React, { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";

function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // State for the current tool, defaulting to 'select'
  const [currentTool, setCurrentTool] = useState("select");

  // Refs to track current tool, shape being drawn, and starting position
  const currentToolRef = useRef(currentTool);
  const drawingShapeRef = useRef(null);
  const startPosRef = useRef(null);

  // Update cur rentToolRef whenever currentTool changes
  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  // Toggle drawing mode and selection based on current tool
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.isDrawingMode = currentTool === "pencil";
      // Disable selection for shape tools, enable for select and pencil
      fabricCanvas.current.selection =
        currentTool === "select" || currentTool === "pencil";
    }
  }, [currentTool]);

  // Initialize canvas and set up event listeners
  useEffect(() => {
    // Use the global fabric object from the script tag
    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
    });

    // Mouse down handler: Start creating shapes
    const onMouseDown = (options) => {
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

    // Mouse move handler: Update shape dimensions
    const onMouseMove = (options) => {
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

    // Mouse up handler: Finalize shape creation
    const onMouseUp = () => {
      drawingShapeRef.current = null;
      startPosRef.current = null;
    };

    // Attach event listeners
    fabricCanvas.current.on("mouse:down", onMouseDown);
    fabricCanvas.current.on("mouse:move", onMouseMove);
    fabricCanvas.current.on("mouse:up", onMouseUp);

    setCanvasReady(true);

    // Cleanup
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off("mouse:down");
        fabricCanvas.current.off("mouse:move");
        fabricCanvas.current.off("mouse:up");
        fabricCanvas.current.dispose();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {canvasReady && (
        <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
      )}
      <div className="flex flex-1">
        <canvas ref={canvasRef} className="border" />
        {canvasReady && <PropertiesPanel canvas={fabricCanvas.current} />}
      </div>
    </div>
  );
}

export default Whiteboard;
