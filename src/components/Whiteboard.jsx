import React, { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";

function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const containerRef = useRef(null); // To get container dimensions
  const [canvasReady, setCanvasReady] = useState(false);

  // Function to resize the canvas based on parent container size
  const resizeCanvas = () => {
    if (canvasRef.current && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const canvasElement = canvasRef.current;

      // Adjust canvas width and height to fit the parent container
      canvasElement.width = container.width;
      canvasElement.height = container.height;

      if (fabricCanvas.current) {
        // Resize fabric canvas as well
        fabricCanvas.current.setWidth(container.width);
        fabricCanvas.current.setHeight(container.height);
      }
    }
  };

  useEffect(() => {
    // Create the Fabric.js canvas
    fabricCanvas.current = new fabric.Canvas(canvasRef.current);
    setCanvasReady(true);

    // Resize canvas initially and on window resize
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen">
      {canvasReady && <Toolbar canvas={fabricCanvas.current} />}
      <div
        ref={containerRef}
        className="relative flex flex-1 w-full h-full"
      >
        <canvas
          ref={canvasRef}
          className="relative top-0 left-0 w-full h-full"
        />
        {canvasReady && <PropertiesPanel canvas={fabricCanvas.current} />}
      </div>
    </div>
  );
}

export default Whiteboard;
