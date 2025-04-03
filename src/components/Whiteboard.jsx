// frontend/src/components/Whiteboard.jsx
import React, { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar";
import PropertiesPanel from "./PropertiesPanel";
import socket from "../socket";

// Ensure fabric objects have an 'id' property for tracking
fabric.Object.prototype.toObject = (function (toObject) {
  return function (propertiesToInclude) {
    propertiesToInclude = (propertiesToInclude || []).concat(["id"]);
    return toObject.call(this, propertiesToInclude);
  };
})(fabric.Object.prototype.toObject);

function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [currentTool, setCurrentTool] = useState("select"); // Default tool
  const currentToolRef = useRef(currentTool); // Ref to access current tool in event handlers

  // Refs for drawing shapes
  const drawingShapeRef = useRef(null);
  const startPosRef = useRef(null);

  // Refs for panning
  const isPanningRef = useRef(false);
  const isDraggingRef = useRef(false); // Used specifically for panning drag
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Ref for tracking other users' cursors
  const cursorsRef = useRef({}); // { userId: fabricObject }

  // Update currentToolRef whenever currentTool changes
  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  // Toggle drawing mode and selection based on current tool
  useEffect(() => {
    if (fabricCanvas.current) {
      const canvas = fabricCanvas.current;
      canvas.isDrawingMode = currentTool === "pencil";
      if (currentTool === "pencil") {
        // Configure pencil brush if needed (example)
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 2;
      }
      // Enable selection unless actively drawing a shape (handled in mouse events)
      canvas.selection = currentTool === "select" || currentTool === "pencil";
      // Disable selection for other tools to prevent selecting while intending to draw
      canvas.getObjects().forEach((obj) => {
        obj.selectable = canvas.selection;
        obj.evented = canvas.selection;
      });
      // Set cursor based on tool
      if (currentTool === "select") canvas.defaultCursor = "default";
      else if (currentTool === "pencil")
        canvas.freeDrawingCursor = "crosshair"; // Or specific pencil cursor
      else canvas.defaultCursor = "crosshair"; // For shape tools

      canvas.renderAll();
    }
  }, [currentTool]);

  // --- Main useEffect for Canvas Initialization and Event Handling ---
  useEffect(() => {
    const CANVAS_WIDTH = 5000; // Large canvas width
    const CANVAS_HEIGHT = 5000; // Large canvas height

    // Initialize Fabric Canvas
    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#f0f0f0", // Lighter grey background
      // Consider disabling object caching if causing issues with frequent updates,
      // but be mindful of performance impact.
      // objectCaching: false,
    });
    const canvas = fabricCanvas.current;

    // Center the view initially
    if (canvasContainerRef.current) {
      const viewportWidth = canvasContainerRef.current.clientWidth;
      const viewportHeight = canvasContainerRef.current.clientHeight;
      canvasContainerRef.current.scrollLeft =
        (CANVAS_WIDTH - viewportWidth) / 2;
      canvasContainerRef.current.scrollTop =
        (CANVAS_HEIGHT - viewportHeight) / 2;
    }

    // --- Socket Event Handlers ---
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      console.log("Joining room:", roomId);
      socket.emit("join-room", roomId);
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      // Optionally handle reconnection logic here
    };

    const handleCanvasState = (state) => {
      if (state && Array.isArray(state.objects)) {
        console.log(
          `Received initial canvas state with ${state.objects.length} objects`
        );
        // Clear existing canvas before loading
        canvas.clear();
        // Make sure cursorsRef is also cleared
        Object.values(cursorsRef.current).forEach((cursor) =>
          canvas.remove(cursor)
        );
        cursorsRef.current = {};

        fabric.util.enlivenObjects(
          state.objects,
          (enlivenedObjects) => {
            enlivenedObjects.forEach((obj) => {
              // Ensure objects loaded are selectable/evented if in select mode
              obj.selectable = currentToolRef.current === "select";
              obj.evented = currentToolRef.current === "select";
              canvas.add(obj);
            });
            canvas.renderAll();
            console.log("Canvas state loaded and rendered.");
          },
          "fabric" // Namespace for fabric objects
        );
      } else {
        console.log("Received empty or invalid canvas state:", state);
        canvas.clear(); // Start with a blank canvas if no state
      }
    };

    const handleCanvasUpdate = (update) => {
      console.log("Received canvas update:", update);
      if (!update || !update.action || !update.object) {
        console.error("Received invalid update data", update);
        return;
      }
      // Ensure object ID exists for modify/remove/add (defensive check)
      if (!update.object.id) {
        console.error("Received update without object ID", update);
        return;
      }

      const objectId = update.object.id;

      if (update.action === "add") {
        // Check if object with same ID already exists (possible race condition?)
        const existingObj = canvas.getObjects().find((o) => o.id === objectId);
        if (existingObj) {
          console.warn(
            "Attempted to add object that already exists:",
            objectId
          );
          // Optionally update the existing one instead, though 'modify' should handle this
          existingObj.set(update.object);
          canvas.renderAll();
        } else {
          fabric.util.enlivenObjects(
            [update.object], // Enliven the single object
            (enlivenedObjects) => {
              if (enlivenedObjects && enlivenedObjects.length > 0) {
                const newObj = enlivenedObjects[0];
                newObj.selectable = currentToolRef.current === "select"; // Set selectability based on current tool
                newObj.evented = currentToolRef.current === "select";
                canvas.add(newObj);
                canvas.renderAll();
              } else {
                console.error(
                  "Failed to enliven object for add:",
                  update.object
                );
              }
            },
            "fabric"
          );
        }
      } else if (update.action === "modify") {
        const obj = canvas.getObjects().find((o) => o.id === objectId);
        if (obj) {
          obj.set(update.object); // Apply the properties from the update
          // Deselect if another user modified the object you have selected? Optional.
          // if (canvas.getActiveObject() === obj) {
          //   canvas.discardActiveObject();
          // }
          canvas.renderAll();
        } else {
          console.warn("Could not find object to modify:", objectId);
          // Optional: Could treat as 'add' if object is unexpectedly missing,
          // implies a potential previous state inconsistency.
          // fabric.util.enlivenObjects([update.object], ... ); // Add if missing
        }
      } else if (update.action === "remove") {
        const obj = canvas.getObjects().find((o) => o.id === objectId);
        if (obj) {
          canvas.remove(obj);
          canvas.renderAll();
        } else {
          console.warn("Could not find object to remove:", objectId);
        }
      }
      // Handle select-all if needed (currently handled via ctrl+a locally)
      // else if (update.action === "select-all") { ... }
    };

    const handleCursorMove = ({ userId, x, y }) => {
      if (userId === socket.id) return; // Don't show own cursor

      if (!cursorsRef.current[userId]) {
        // Create a new cursor representation (e.g., a small circle)
        const cursor = new fabric.Circle({
          left: x,
          top: y,
          radius: 4,
          fill: `hsl(${userId.charCodeAt(0) % 360}, 70%, 50%)`, // Basic color based on user ID
          stroke: "white",
          strokeWidth: 1,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
          objectCaching: false, // Prevent caching issues with frequent moves
        });
        canvas.add(cursor);
        cursorsRef.current[userId] = cursor;
      } else {
        // Update existing cursor position smoothly
        cursorsRef.current[userId].animate(
          { left: x, top: y },
          {
            duration: 50, // Short duration for smooth feel
            onChange: canvas.renderAll.bind(canvas),
          }
        );
        // Or without animation:
        // cursorsRef.current[userId].set({ left: x, top: y });
      }
      // Optional: RenderAll on every move can be heavy, animation handles render
      // canvas.renderAll();
    };

    const handleUserLeft = (userId) => {
      console.log("User left:", userId);
      if (cursorsRef.current[userId]) {
        canvas.remove(cursorsRef.current[userId]);
        delete cursorsRef.current[userId];
        canvas.renderAll();
      }
    };

    // Connect socket and register listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("canvas-state", handleCanvasState);
    socket.on("canvas-update", handleCanvasUpdate);
    socket.on("cursor-move", handleCursorMove);
    socket.on("user-left", handleUserLeft);
    // If socket isn't already connected (e.g., coming from RoomJoin)
    if (!socket.connected) {
      socket.connect(); // Establish connection
    } else {
      handleConnect(); // Already connected, just join the room
    }

    // --- Fabric Canvas Event Handlers ---
    const onMouseDown = (options) => {
      // Check for panning first (activated by spacebar)
      if (isPanningRef.current) {
        isDraggingRef.current = true; // Start panning drag
        lastPosRef.current = { x: options.e.clientX, y: options.e.clientY };
        canvas.setCursor("grabbing");
        canvas.selection = false; // Disable selection during pan
        return;
      }

      // Ignore clicks if in select/pencil mode (handled by Fabric) or if clicking an existing object
      if (
        currentToolRef.current === "select" ||
        currentToolRef.current === "pencil" ||
        options.target
      ) {
        return;
      }

      // --- Start Drawing Shapes ---
      const pointer = canvas.getPointer(options.e);
      startPosRef.current = pointer;

      let shape = null;
      const id = socket.id + "_" + Date.now(); // Generate unique ID

      if (currentToolRef.current === "rectangle") {
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 2,
          id: id,
          selectable: false,
          evented: false, // Non-interactive while drawing
        });
      } else if (currentToolRef.current === "circle") {
        shape = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          originX: "left",
          originY: "top", // Start origin for easier calculation
          radius: 0,
          fill: "transparent",
          stroke: "black",
          strokeWidth: 2,
          id: id,
          selectable: false,
          evented: false,
        });
      } else if (currentToolRef.current === "line") {
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: "black",
          strokeWidth: 2,
          id: id,
          selectable: false,
          evented: false,
        });
      }

      if (shape) {
        drawingShapeRef.current = shape;
        canvas.add(shape);
        canvas.requestRenderAll(); // Request render
      }
    };

    const onMouseMove = (options) => {
      const pointer = canvas.getPointer(options.e);
      // Emit cursor position regardless of panning/drawing state
      socket.emit("cursor-move", { roomId, x: pointer.x, y: pointer.y });

      // Handle Panning
      if (isPanningRef.current && isDraggingRef.current) {
        const e = options.e;
        const deltaX = e.clientX - lastPosRef.current.x;
        const deltaY = e.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        canvas.relativePan(new fabric.Point(deltaX, deltaY));
        return; // Don't process drawing if panning
      }

      // Handle Drawing Shapes (only if a shape is being drawn)
      if (!drawingShapeRef.current || !startPosRef.current) return;

      const shape = drawingShapeRef.current;

      if (currentToolRef.current === "rectangle") {
        const width = Math.abs(pointer.x - startPosRef.current.x);
        const height = Math.abs(pointer.y - startPosRef.current.y);
        const left =
          pointer.x < startPosRef.current.x ? pointer.x : startPosRef.current.x;
        const top =
          pointer.y < startPosRef.current.y ? pointer.y : startPosRef.current.y;
        shape.set({ left, top, width, height });
      } else if (currentToolRef.current === "circle") {
        const dx = pointer.x - startPosRef.current.x;
        const dy = pointer.y - startPosRef.current.y;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        const centerX = (startPosRef.current.x + pointer.x) / 2;
        const centerY = (startPosRef.current.y + pointer.y) / 2;
        shape.set({
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center", // Set origin to center
          radius: radius,
        });
      } else if (currentToolRef.current === "line") {
        shape.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.requestRenderAll(); // Request render
    };

    const onMouseUp = () => {
      // Finalize Panning
      if (isPanningRef.current) {
        isDraggingRef.current = false;
        canvas.setCursor(canvas.defaultCursor); // Restore cursor
        // Re-enable selection if needed, depending on the current tool
        canvas.selection =
          currentToolRef.current === "select" ||
          currentToolRef.current === "pencil";
      }

      // Finalize Drawing Shape
      if (drawingShapeRef.current) {
        const finalShape = drawingShapeRef.current;
        // Perform final adjustments if needed (e.g., ensure min size)

        // Check for zero-size shapes and remove locally if found
        const isZeroSize =
          (finalShape.type === "rect" &&
            (finalShape.width === 0 || finalShape.height === 0)) ||
          (finalShape.type === "circle" && finalShape.radius === 0) ||
          (finalShape.type === "line" &&
            finalShape.x1 === finalShape.x2 &&
            finalShape.y1 === finalShape.y2);

        if (isZeroSize) {
          console.log(
            "Removed zero-size shape locally:",
            finalShape.type,
            finalShape.id
          );
          canvas.remove(finalShape);
        } else {
          // Make the shape interactive *after* drawing is complete
          finalShape.set({
            selectable: true,
            evented: true,
          });
          console.log(
            "Finalizing and emitting shape:",
            finalShape.type,
            finalShape.id
          );
          // Emit the 'add' event with the final object state
          socket.emit("canvas-update", {
            roomId,
            update: { action: "add", object: finalShape.toJSON() }, // id is included by default override
          });
        }

        drawingShapeRef.current = null; // Reset drawing state
      }
      startPosRef.current = null; // Reset start position
      canvas.requestRenderAll();
    };

    // Handler for Pencil (Free Draw) Path Creation
    const handlePathCreated = (e) => {
      if (e.path) {
        const path = e.path;
        // Assign a unique ID
        path.id = socket.id + "_" + Date.now();
        console.log("Path created, emitting add:", path.id);

        // Emit the 'add' event for the path
        socket.emit("canvas-update", {
          roomId,
          update: { action: "add", object: path.toJSON() }, // id included by override
        });
      }
    };

    // Handler for Object Modifications (Move, Resize, Rotate, Skew)
    const handleObjectModified = (e) => {
      if (e.target) {
        const modifiedObject = e.target;

        // Handle ActiveSelection (multi-select modification)
        if (
          modifiedObject.type === "activeSelection" &&
          modifiedObject._objects
        ) {
          modifiedObject.canvas.discardActiveObject(); // Deselect group

          modifiedObject._objects.forEach((obj) => {
            if (obj.id) {
              console.log(
                "Modifying object within selection:",
                obj.type,
                obj.id
              );
              socket.emit("canvas-update", {
                roomId,
                update: { action: "modify", object: obj.toJSON() },
              });
            } else {
              console.error("Object within ActiveSelection missing ID!", obj);
            }
          });
          // Re-select the objects individually? Or let users re-select?
          // For simplicity, we leave them deselected after modification emission.
          // canvas.setActiveObject(new fabric.ActiveSelection(modifiedObject._objects, {canvas: canvas}));
        } else if (modifiedObject.id) {
          // Handle single object modification
          console.log(
            "Object modified, emitting modify:",
            modifiedObject.type,
            modifiedObject.id
          );
          socket.emit("canvas-update", {
            roomId,
            update: { action: "modify", object: modifiedObject.toJSON() },
          });
        } else {
          console.error("Modified object is missing ID!", modifiedObject);
        }
      }
    };

    // --- Document Event Listeners (Keyboard) ---
    const handleKeyDown = (e) => {
      // Prioritize input fields to allow typing normally
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable);

      // Panning with Spacebar
      if (e.key === " " && !isPanningRef.current && !isInputActive) {
        e.preventDefault(); // Prevent page scroll
        isPanningRef.current = true;
        canvas.setCursor("grab");
        canvas.selection = false; // Disable selection while panning intent is active
        canvas.renderAll();
      }
      // Delete object(s) with Delete/Backspace key
      else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isInputActive
      ) {
        e.preventDefault();
        const activeObjects = canvas.getActiveObjects(); // Gets single or multiple selected
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => {
            if (obj.id) {
              canvas.remove(obj);
              socket.emit("canvas-update", {
                roomId,
                update: { action: "remove", object: { id: obj.id } },
              });
            } else {
              console.error("Attempted to delete object without ID", obj);
              canvas.remove(obj); // Still remove locally
            }
          });
          canvas.discardActiveObject(); // Deselect after removing
          canvas.renderAll();
        }
      }
      // Select All with Ctrl+A / Cmd+A
      else if ((e.ctrlKey || e.metaKey) && e.key === "a" && !isInputActive) {
        e.preventDefault(); // Prevent browser's default select all
        const allObjects = canvas.getObjects().filter((obj) => obj.selectable); // Select only selectable objects
        if (allObjects.length > 0) {
          canvas.discardActiveObject(); // Clear current selection
          const sel = new fabric.ActiveSelection(allObjects, {
            canvas: canvas,
          });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
          // Note: Select All is usually a local action, but you could emit if needed
          // socket.emit("canvas-update", { roomId, update: { action: "select-all" } });
        }
      }
    };

    const handleKeyUp = (e) => {
      // Stop Panning when Spacebar is released
      if (e.key === " " && isPanningRef.current) {
        isPanningRef.current = false;
        isDraggingRef.current = false; // Ensure dragging stops too
        // Restore cursor and selection based on the current tool
        canvas.selection =
          currentToolRef.current === "select" ||
          currentToolRef.current === "pencil";
        if (currentToolRef.current === "select")
          canvas.defaultCursor = "default";
        else if (currentToolRef.current === "pencil")
          canvas.freeDrawingCursor = "crosshair"; // Or specific pencil cursor
        else canvas.defaultCursor = "crosshair"; // For shape tools
        canvas.renderAll();
      }
    };

    // Attach Event Listeners
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
    canvas.on("path:created", handlePathCreated); // For pencil tool
    canvas.on("object:modified", handleObjectModified); // For move, scale, rotate
    // Note: 'object:moving', 'object:scaling', etc. exist for real-time updates during modification,
    // but emitting on every frame can be network-intensive. 'object:modified' (on mouse up) is often sufficient.

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    setCanvasReady(true);
    console.log("Whiteboard component mounted and ready.");

    // --- Cleanup Function ---
    return () => {
      console.log("Whiteboard component unmounting. Cleaning up...");
      // Remove Socket listeners
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("canvas-state", handleCanvasState);
      socket.off("canvas-update", handleCanvasUpdate);
      socket.off("cursor-move", handleCursorMove);
      socket.off("user-left", handleUserLeft);
      // Consider emitting a 'leave-room' event if needed by the backend
      // socket.emit('leave-room', roomId);

      // Remove Document listeners
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);

      // Remove Fabric Canvas listeners and dispose
      if (fabricCanvas.current) {
        fabricCanvas.current.off("mouse:down", onMouseDown);
        fabricCanvas.current.off("mouse:move", onMouseMove);
        fabricCanvas.current.off("mouse:up", onMouseUp);
        fabricCanvas.current.off("path:created", handlePathCreated);
        fabricCanvas.current.off("object:modified", handleObjectModified);
        fabricCanvas.current.dispose();
        fabricCanvas.current = null; // Clear the ref
        console.log("Fabric canvas disposed.");
      }
      setCanvasReady(false);
    };
  }, [roomId]); // Re-run useEffect if roomId changes

  // --- Render Component ---
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-200">
      {/* Toolbar */}
      {canvasReady && (
        <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
      )}

      {/* Canvas Container (for scrolling/panning) */}
      <div
        ref={canvasContainerRef}
        className="absolute top-0 left-0 w-full h-full overflow-auto cursor-default no-scrollbar" // Hide scrollbars, manage via pan
        // Add cursor style based on isPanningRef maybe?
      >
        {/* The actual canvas element */}
        <canvas ref={canvasRef} />
      </div>

      {/* Properties Panel */}
      {/* Pass canvas instance and roomId */}
      {canvasReady && fabricCanvas.current && (
        <PropertiesPanel canvas={fabricCanvas.current} roomId={roomId} />
      )}

      {/* Loading/Waiting Indicator (Optional) */}
      {!canvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50">
          <p className="text-white text-xl">Loading Whiteboard...</p>
        </div>
      )}
    </div>
  );
}

export default Whiteboard;
