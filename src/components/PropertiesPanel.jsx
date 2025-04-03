import React, { useState, useEffect } from "react";
import socket from "../socket";

function PropertiesPanel({ canvas, roomId }) {
  const [selectedObject, setSelectedObject] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeType, setStrokeType] = useState("[]");
  const [fillColor, setFillColor] = useState("transparent");
  const [opacity, setOpacity] = useState(1);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  // Sync state with selected object when it changes
  useEffect(() => {
    if (!canvas) return;

    const updatePanelState = (target) => {
      if (!target) {
        setSelectedObject(null);
        return;
      }
      // Handle potential ActiveSelection (multiple objects)
      // For simplicity, we'll show properties of the first object
      // or disable editing if multiple with different properties are selected.
      // A more advanced approach would handle common properties.
      const obj =
        target.type === "activeSelection" ? target._objects[0] : target;

      if (obj) {
        setSelectedObject(obj); // Keep track of the actual object
        setStrokeWidth(obj.strokeWidth || 2);
        setStrokeColor(obj.stroke || "#000000");
        // Ensure strokeDashArray is stringified for the select input value
        setStrokeType(JSON.stringify(obj.strokeDashArray || []));
        setFillColor(obj.fill || "transparent");
        setOpacity(obj.opacity === undefined ? 1 : obj.opacity); // Handle undefined opacity
        setFlipX(obj.flipX || false);
        setFlipY(obj.flipY || false);
      } else {
        setSelectedObject(null); // No valid object found
      }
    };

    const handleSelectionCreated = (e) =>
      updatePanelState(e.target || (e.selected ? e.selected[0] : null));
    const handleSelectionUpdated = (e) =>
      updatePanelState(e.target || (e.updated ? e.updated[0] : null));
    const handleSelectionCleared = () => setSelectedObject(null);

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionUpdated);
    canvas.on("selection:cleared", handleSelectionCleared);
    // Also update if an object is modified (e.g., properties changed programmatically elsewhere)
    // canvas.on('object:modified', (e) => {
    //     if (e.target === selectedObject) {
    //         updatePanelState(e.target);
    //     }
    // });

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionUpdated);
      canvas.off("selection:cleared", handleSelectionCleared);
      // canvas.off('object:modified');
    };
  }, [canvas]); // Rerun effect if canvas instance changes

  // Update object property locally and emit the change
  const updateProperty = (property, value, stateSetter) => {
    // Use the selectedObject state which refers to the actual fabric object
    if (selectedObject && canvas && roomId) {
      const objectsToUpdate = canvas.getActiveObjects(); // Get all selected objects

      if (objectsToUpdate.length > 0) {
        objectsToUpdate.forEach((obj) => {
          // Apply the change locally first
          obj.set(property, value);

          // Ensure object has ID before emitting
          if (obj.id) {
            // Emit the 'modify' event with the updated object's full state
            console.log(
              `Emitting modify for property ${property} on ${obj.id}`
            );
            socket.emit("canvas-update", {
              roomId,
              update: {
                action: "modify",
                // Send the complete object state using toJSON (which includes 'id' via our override)
                object: obj.toJSON(),
              },
            });
          } else {
            console.error(
              "Cannot sync property change: Selected object missing ID",
              obj
            );
          }
        });

        canvas.renderAll(); // Render changes locally
        // Update local React state (e.g., for the input controls)
        if (stateSetter) {
          stateSetter(value);
        }
      }
    }
  };

  // Function to delete selected objects
  const handleDelete = () => {
    if (canvas && roomId) {
      // Check for roomId
      const activeObjects = canvas.getActiveObjects(); // Get single or multiple
      if (activeObjects.length > 0) {
        activeObjects.forEach((obj) => {
          if (obj.id) {
            // Ensure object has ID before removing
            canvas.remove(obj); // Remove locally
            console.log(`Emitting remove for ${obj.id}`);
            socket.emit("canvas-update", {
              roomId, // Use the prop
              update: { action: "remove", object: { id: obj.id } }, // Just need ID for removal
            });
          } else {
            console.error("Attempted to delete object without ID", obj);
            canvas.remove(obj); // Still remove locally
          }
        });
        // Deselect after removing all objects in the selection
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObject(null); // Clear panel state
      }
    }
  };

  if (!selectedObject)
    return (
      <div className="w-64 p-4 bg-white border-l border-gray-200 shadow-lg fixed left-8 bottom-10 rounded-xl z-10">
        <p className="text-sm text-gray-500">
          Select an object to edit properties.
        </p>
      </div>
    );

  return (
    // Outer div styles adjusted slightly for visibility if needed
    <div className="w-64 p-4 bg-white border-l border-gray-200 shadow-lg fixed h-auto max-h-[calc(100vh-8rem)] overflow-y-auto left-8 bottom-10 rounded-xl z-10 no-scrollbar">
      <h3 className="text-lg mb-4 font-semibold">Properties</h3>

      {/* Stroke Width */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Width
        </label>
        <input
          type="number"
          min="0" // Allow 0 for no stroke
          max="50" // Increased max
          value={strokeWidth}
          onChange={(e) =>
            updateProperty(
              "strokeWidth",
              // Ensure value is integer, default to 0 if invalid
              parseInt(e.target.value, 10) || 0,
              setStrokeWidth
            )
          }
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Stroke Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Color
        </label>
        {/* Use color input for better UX */}
        <input
          type="color"
          value={strokeColor}
          onChange={(e) =>
            updateProperty("stroke", e.target.value, setStrokeColor)
          }
          className="w-full h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
        />
        {/* Optional: Select dropdown as fallback or alternative */}
        {/* <select ... > ... </select> */}
      </div>

      {/* Stroke Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Type
        </label>
        <select
          value={strokeType} // Value is the stringified array
          onChange={(e) => {
            const stringValue = e.target.value;
            const arrayValue = JSON.parse(stringValue);
            // Pass the actual array to updateProperty, but the string to the state setter
            updateProperty("strokeDashArray", arrayValue, () =>
              setStrokeType(stringValue)
            );
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="[]">Solid</option>
          <option value="[5, 5]">Dashed</option>
          <option value="[10, 4]">Long Dash</option>
          <option value="[2, 3]">Dotted</option>
        </select>
      </div>

      {/* Fill Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fill Color
        </label>
        <input
          type="color"
          // Special handling for 'transparent' which is not a valid hex color
          value={fillColor === "transparent" ? "#ffffff" : fillColor} // Show white if transparent, actual value is handled
          onChange={(e) => updateProperty("fill", e.target.value, setFillColor)}
          className="w-full h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
        />
        <button
          onClick={() => updateProperty("fill", "transparent", setFillColor)}
          className={`w-full p-1 mt-1 text-sm border rounded ${
            fillColor === "transparent"
              ? "bg-blue-200 border-blue-400"
              : "border-gray-300 hover:bg-gray-100"
          }`}
        >
          Set Transparent
        </button>
        {/* Optional: Select dropdown */}
        {/* <select ... > ... </select> */}
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opacity ({opacity.toFixed(1)}) {/* Show value */}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) =>
            updateProperty("opacity", parseFloat(e.target.value), setOpacity)
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Flip X and Y */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Flip
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => updateProperty("flipX", !flipX, setFlipX)}
            className={`p-2 text-sm rounded-lg ${
              flipX
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Flip X
          </button>
          <button
            onClick={() => updateProperty("flipY", !flipY, setFlipY)}
            className={`p-2 text-sm rounded-lg ${
              flipY
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Flip Y
          </button>
        </div>
      </div>

      {/* Delete Button */}
      <div className="mt-6 border-t pt-4">
        <button
          onClick={handleDelete}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Delete Selected
        </button>
      </div>
    </div>
  );
}

export default PropertiesPanel;
