import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { getUserFromApiGraph } from "../services/graphService"; // Función para obtener el usuario
import "../styles/Lobby.css";

const socket = io("ws://localhost:3000");

const charactersList = [
    { id: "bomber1", emoji: "/assets/character1.webp", name: "Bomber Azul" },
    { id: "bomber2", emoji: "/assets/character2.webp", name: "Bomber Rojo" },
    { id: "bomber3", emoji: "/assets/character3.webp", name: "Bomber Verde" },
    { id: "bomber4", emoji: "/assets/character4.webp", name: "Bomber Robot" },
];

const Lobby = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [username, setUsername] = useState("");
    const [players, setPlayers] = useState({});
    const [characters, setCharacters] = useState({});
    const [ready, setReady] = useState({});

    useEffect(() => {
        // Obtener el nombre del usuario desde Microsoft Entra ID
        const fetchUser = async () => {
            const profile = await getUserFromApiGraph(instance, accounts);
            if (profile) {
                setUsername(profile.displayName); // Guardamos el nombre del usuario
                socket.emit("joinRoom", { room, username: profile.displayName });
            }
        };

        fetchUser();

        socket.on("updateLobby", (data) => {
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
        });

        socket.on("gameStart", () => {
            navigate(`/game/${room}`);
        });

        return () => {
            socket.off("updateLobby");
            socket.off("gameStart");
        };
    }, [room, navigate, instance, accounts]);

    const selectCharacter = (char) => {
        socket.emit("selectCharacter", { room, character: char, username });
    };

    const setPlayerReady = () => {
        socket.emit("setReady", { room, username });
    };

    return (
        <div className="lobby-container">
            <h2 className="room-title">Sala {room}</h2>

            <div className="characters-container">
                <h3 className="subtitle">Selecciona tu personaje:</h3>
                <div className="characters-grid">
                    {charactersList.map((char) => (
                        <button 
                            key={char.id}
                            className={`button-character ${Object.values(characters).includes(char.id) ? "disabled" : ""}`}
                            onClick={() => selectCharacter(char.id)}
                            disabled={Object.values(characters).includes(char.id)}
                        >
                            <img className="character-img" src={char.emoji} alt={char.name} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="players-container">
                <h3 className="subtitle">Jugadores en la sala:</h3>
                <div className="players-list">
                    {Object.keys(players).map((playerId) => (
                        <div key={playerId} className="player-item">
                            <span className="player-name">{players[playerId]}</span>
                            <span className="player-character">{characters[playerId] || "Sin personaje"}</span>
                            <span className={`player-status ${ready[playerId] ? "ready" : "not-ready"}`}>
                                {ready[playerId] ? "✅ Listo" : "❌ No listo"}
                            </span>
                        </div>
                    ))}
                </div>
                <button className="ready-button" onClick={setPlayerReady}>
                    <img className="ready-img" src="/assets/ok.png" alt="Listo" />
                </button>
            </div>
        </div>
    );
};

export default Lobby;