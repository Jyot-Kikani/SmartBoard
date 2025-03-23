import React from "react";

function Toolbar({ canvas }) {
  const setTool = (tool) => {
    if (!canvas) {
      console.log("Canvas not initialized yet");
      return; // Exit if canvas is null
    }
    console.log("Canvas object:", canvas); // Add this line
    if (tool === "pencil") {
      canvas.isDrawingMode = true;
    } else {
      canvas.isDrawingMode = false;
    }
  };

  return (
    <div className="fixed left-0 right-0 p-2 bg-gray-200 flex w-[60%] mx-auto h-fit rounded shadow-md top-5 z-10">
      <button
        className="p-2 bg-white rounded hover:cursor-pointer h-10"
        onClick={() => setTool("pencil")}
      >
        Hello World
      </button>
    </div>
  );
}

export default Toolbar;
