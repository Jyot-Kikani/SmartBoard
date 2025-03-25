import React from "react";
import { FaPencilAlt } from "react-icons/fa";
import { FaArrowPointer } from "react-icons/fa6";
import { PiRectangleBold } from "react-icons/pi";
import { FaRegCircle } from "react-icons/fa6";
import { PiLineSegmentBold } from "react-icons/pi";

function Toolbar({ currentTool, setCurrentTool }) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-lg p-3 flex space-x-2 fixed top-4 z-10 justify-center left-0 right-0 mx-auto w-fit rounded-xl px-4">
      <button
        onClick={() => setCurrentTool("select")}
        className={
          currentTool === "select"
            ? "p-2 bg-blue-500 text-white rounded"
            : "p-2 bg-white text-gray-700 rounded hover:bg-gray-100"
        }
      >
        <FaArrowPointer />
      </button>
      <button
        onClick={() => setCurrentTool("pencil")}
        className={
          currentTool === "pencil"
            ? "p-2 bg-blue-500 text-white rounded"
            : "p-2 bg-white text-gray-700 rounded hover:bg-gray-100"
        }
      >
        <FaPencilAlt />
      </button>
      <button
        onClick={() => setCurrentTool("rectangle")}
        className={
          currentTool === "rectangle"
            ? "p-2 bg-blue-500 text-white rounded"
            : "p-2 bg-white text-gray-700 rounded hover:bg-gray-100"
        }
      >
        <PiRectangleBold />
      </button>
      <button
        onClick={() => setCurrentTool("circle")}
        className={
          currentTool === "circle"
            ? "p-2 bg-blue-500 text-white rounded"
            : "p-2 bg-white text-gray-700 rounded hover:bg-gray-100"
        }
      >
        <FaRegCircle />
      </button>
      <button
        onClick={() => setCurrentTool("line")}
        className={
          currentTool === "line"
            ? "p-2 bg-blue-500 text-white rounded"
            : "p-2 bg-white text-gray-700 rounded hover:bg-gray-100"
        }
      >
        <PiLineSegmentBold />
      </button>
    </div>
  );
}

export default Toolbar;
