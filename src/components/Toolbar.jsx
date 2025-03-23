import React from 'react';

function Toolbar({ currentTool, setCurrentTool }) {
  return (
    <div className="p-2 bg-gray-200 flex space-x-2">
      <button
        onClick={() => setCurrentTool('select')}
        className={
          currentTool === 'select'
            ? 'p-2 bg-blue-500 text-white rounded'
            : 'p-2 bg-white rounded'
        }
      >
        Select
      </button>
      <button
        onClick={() => setCurrentTool('pencil')}
        className={
          currentTool === 'pencil'
            ? 'p-2 bg-blue-500 text-white rounded'
            : 'p-2 bg-white rounded'
        }
      >
        Pencil
      </button>
      <button
        onClick={() => setCurrentTool('rectangle')}
        className={
          currentTool === 'rectangle'
            ? 'p-2 bg-blue-500 text-white rounded'
            : 'p-2 bg-white rounded'
        }
      >
        Rectangle
      </button>
      <button
        onClick={() => setCurrentTool('circle')}
        className={
          currentTool === 'circle'
            ? 'p-2 bg-blue-500 text-white rounded'
            : 'p-2 bg-white rounded'
        }
      >
        Circle
      </button>
      <button
        onClick={() => setCurrentTool('line')}
        className={
          currentTool === 'line'
            ? 'p-2 bg-blue-500 text-white rounded'
            : 'p-2 bg-white rounded'
        }
      >
        Line
      </button>
    </div>
  );
}

export default Toolbar;