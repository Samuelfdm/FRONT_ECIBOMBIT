import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Rooms from "../components/Rooms"; 
import "../styles/Options.css"


const socket = io("http://localhost:3001");

function Options() {
  const [inRoom, setInRoom] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [rooms, setRooms] = useState([]); // Lista de salas disponibles
  const [selectedRoom, setSelectedRoom] = useState(""); // Sala seleccionada

  useEffect(() => {
    // Escuchar actualizaciones de jugadores en la sala
    socket.on("roomUpdate", (players) => {
      setPlayers(players);
    });

    // Escuchar la lista de salas disponibles
    socket.on("roomsList", (rooms) => {
      setRooms(rooms);
    });

    return () => {
      socket.off("roomUpdate");
      socket.off("roomsList");
    };
  }, []);

  // Unirse a una sala
  const joinRoom = () => {
    if (!inRoom && playerName && selectedRoom) {
      socket.emit("joinRoom", selectedRoom, playerName);
      setInRoom(true);
    }
  };

  // Salir de la sala
  const leaveRoom = () => {
    if (selectedRoom) {
      socket.emit("leaveRoom", selectedRoom, playerName);
      setPlayers([]);
      setInRoom(false);
    }
  };

  return (
    <div className="option-container">
      <input
        type="text"
        placeholder="Tu nombre"
        onChange={(e) => setPlayerName(e.target.value)}
      />

      <h2>Salas disponibles</h2>
      {/* Usamos el componente Rooms para mostrar las salas */}
      <Rooms rooms={rooms} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />

      <button onClick={joinRoom} disabled={!selectedRoom || inRoom}>
        Unirse
      </button>
      <button onClick={leaveRoom} disabled={!inRoom}>
        Salir
      </button>

      <h3>Jugadores en la sala:</h3>
      <ul>
        {players.map((p, index) => (
          <li key={index}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default Options;
