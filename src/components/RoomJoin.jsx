import React, { useState } from "react";

function RoomJoin({ onJoin }) {
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId);
    } else {
      // Generate a random room ID (temporary; backend will handle this later)
      const newRoomId = Math.random().toString(36).substring(7);
      onJoin(newRoomId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl mb-4">Join or Create a Room</h2>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID or leave blank to create new"
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          Join Room
        </button>
      </form>
    </div>
  );
}

export default RoomJoin;
