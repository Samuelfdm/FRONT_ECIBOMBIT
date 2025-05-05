import React from "react";
import "../style/Rooms.css";

function Rooms({ rooms, selectedRoom, setSelectedRoom }) {
  return (
    <div className="rooms-wrapper">
      <div className="rooms-container">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => setSelectedRoom(room)}
            className={`room-button ${selectedRoom === room ? "selected" : ""}`}
          >
            {room}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
