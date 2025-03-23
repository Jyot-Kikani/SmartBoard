import React, { useState, useEffect } from 'react';

function PropertiesPanel({ canvas }) {
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    if (!canvas) return; // Wait until canvas is initialized

    const handleSelection = (e) => {
      setSelectedObject(e.selected[0]);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedObject(null));

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared');
    };
  }, [canvas]); // Re-run effect if canvas changes

  if (!selectedObject) return null;

  return (
    <div className="w-64 p-4 bg-white">
      <h3 className="text-lg mb-2">Properties</h3>
      <div className="mb-2">
        <label>Fill Color</label>
        <input
          type="color"
          value={selectedObject.fill || '#000000'}
          onChange={(e) => {
            selectedObject.set('fill', e.target.value);
            canvas.renderAll();
          }}
        />
      </div>
    </div>
  );
}

export default PropertiesPanel;