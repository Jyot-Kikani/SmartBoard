import React, { useState } from "react";

function RoomJoin({ onJoin }) {
  const [roomId, setRoomId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId);
    } else {
      const newRoomId = Math.random().toString(36).substring(7);
      onJoin(newRoomId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url(https://static.vecteezy.com/system/resources/previews/013/396/404/non_2x/crumpled-paper-texture-realisric-crease-sheet-free-vector.jpg)] bg-cover">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-lg shadow-xl w-sm"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 font-display">
          Join or Create a Room
        </h2>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID or leave blank to create new"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-4 font-display"
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Join Room
        </button>
      </form>
    </div>
  );
}

export default RoomJoin;
