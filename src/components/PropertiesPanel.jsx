import React, { useState, useEffect } from "react";

function PropertiesPanel({ canvas }) {
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

    const handleSelection = (e) => {
      const obj = e.selected[0];
      setSelectedObject(obj);
      setStrokeWidth(obj.strokeWidth || 2);
      setStrokeColor(obj.stroke || "#000000");
      setStrokeType(JSON.stringify(obj.strokeDashArray || []));
      setFillColor(obj.fill || "transparent");
      setOpacity(obj.opacity || 1);
      setFlipX(obj.flipX || false);
      setFlipY(obj.flipY || false);
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => setSelectedObject(null));

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared");
    };
  }, [canvas]);

  // Update object and canvas when properties change
  const updateProperty = (property, value, stateSetter) => {
    if (selectedObject) {
      selectedObject.set(property, value);
      canvas.renderAll();
      stateSetter(value); // Sync local state
    }
  };

  // Function to delete selected objects
  const handleDelete = () => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length > 0) {
        activeObjects.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    }
  };

  if (!selectedObject) return null;

  return (
    <div className="w-64 p-4 bg-white border-l border-gray-200 shadow-lg fixed h-[80%] overflow-y-scroll left-8 bottom-10 rounded-xl no-scrollbar">
      <h3 className="text-lg mb-4 font-semibold">Properties</h3>

      {/* Stroke Width */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Width
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) =>
            updateProperty(
              "strokeWidth",
              parseInt(e.target.value),
              setStrokeWidth
            )
          }
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Stroke Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Color
        </label>
        <select
          value={strokeColor}
          onChange={(e) =>
            updateProperty("stroke", e.target.value, setStrokeColor)
          }
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="#000000">Black</option>
          <option value="#FF0000">Red</option>
          <option value="#00FF00">Green</option>
          <option value="#0000FF">Blue</option>
          <option value="#FFA500">Orange</option>
        </select>
      </div>

      {/* Stroke Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stroke Type
        </label>
        <select
          value={strokeType}
          onChange={(e) => {
            const newValue = JSON.parse(e.target.value);
            updateProperty("strokeDashArray", newValue, () =>
              setStrokeType(e.target.value)
            );
          }}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="[]">Solid</option>
          <option value="[5, 5]">Dashed</option>
          <option value="[2, 5]">Dotted</option>
        </select>
      </div>

      {/* Fill Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fill Color
        </label>
        <select
          value={fillColor}
          onChange={(e) => updateProperty("fill", e.target.value, setFillColor)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="transparent">Transparent</option>
          <option value="#E6E6FA">Light Purple</option>
          <option value="#FFD1DC">Light Pink</option>
          <option value="#CCE5FF">Light Blue</option>
          <option value="#FFFFCC">Light Yellow</option>
        </select>
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opacity
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
          className="w-full"
        />
        <span className="text-sm">{opacity}</span>
      </div>

      {/* Flip X and Y */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Flip
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => updateProperty("flipX", !flipX, setFlipX)}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Flip X ({flipX ? "On" : "Off"})
          </button>
          <button
            onClick={() => updateProperty("flipY", !flipY, setFlipY)}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Flip Y ({flipY ? "On" : "Off"})
          </button>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleDelete}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete Object
        </button>
      </div>
    </div>
  );
}

export default PropertiesPanel;
