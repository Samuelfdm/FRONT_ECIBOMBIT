import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../components/Socket";
import {getUserFromApiGraph} from "../services/graphService"; // Importamos la función para obtener el usuario
import "../styles/Options.css";

const Options = () => {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState("");
    const [username, setUsername] = useState(""); // Estado para almacenar el nombre del usuario
    const navigate = useNavigate();

    useEffect(() => {
        // Obtener el nombre del usuario
        getUserFromApiGraph().then((user) => {
            if (user) {
                setUsername(user.name); // Asignamos el nombre del usuario
            } else {
                alert("Error obteniendo el usuario");
            }
        });

        // Conectar a socket solo si no está conectado
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit("getRooms");
        socket.on("roomsList", (data) => setRooms(data));

        return () => socket.off("roomsList");
    }, []);

    const joinRoom = (room) => {
        if (!room.trim()) return;

        socket.emit("joinRoom", { room, username }, (response) => {
            console.log("Respuesta del servidor:", response);

            if (response && response.success) {
                navigate(`/lobby/${room}`);
            } else {
                alert(response?.message || "Error al unirse a la sala.");
            }
        });
    };

    return (
        <div className="option-container">
            <h2 className="section-title">Salas disponibles</h2>
            <p className="username-display">Jugador: {username || "Cargando..."}</p> {/* Mostramos el nombre del usuario */}
            
            <div className="room-creation">
                <input
                    type="text"
                    placeholder="Nombre de la sala"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="room-input"
                />
                <button className="create-button" onClick={() => joinRoom(newRoom)}>Crear Sala</button>
            </div>

            <div className="rooms-list">
                {rooms.map((room, i) => (
                    <button className="rooms" key={i} onClick={() => joinRoom(room)}>
                        {room}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Options;
