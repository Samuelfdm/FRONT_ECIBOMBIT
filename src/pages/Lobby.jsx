import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import axios from "axios";
import "../styles/Lobby.css";

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
    const [username, setUserName] = useState("");
    const [players, setPlayers] = useState({});
    const [characters, setCharacters] = useState({});
    const [ready, setReady] = useState({});
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("ws://localhost:3000");
        setSocket(newSocket);

        newSocket.on("updateLobby", (data) => {
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
        });

        newSocket.on("gameStart", () => {
            navigate(`/game/${room}`);
        });

        return () => {
            newSocket.off("updateLobby");
            newSocket.off("gameStart");
            newSocket.disconnect();
        };
    }, [room, navigate]);

    useEffect(() => {
        const fetchUserName = async () => {
            if (accounts.length === 0) {
                console.error("No hay cuentas activas en MSAL.");
                return;
            }

            try {
                const tokenResponse = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: accounts[0], // Selecciona la cuenta activa
                });

                const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                });

                setUserName(graphResponse.data.displayName);
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    try {
                        const tokenResponse = await instance.acquireTokenPopup({
                            scopes: ["User.Read"],
                        });

                        const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                        });

                        setUserName(graphResponse.data.displayName);
                    } catch (popupError) {
                        console.error("Error al obtener el nombre del usuario:", popupError);
                    }
                } else {
                    console.error("Error al obtener el nombre del usuario:", error);
                }
            }
        };

        fetchUserName();
    }, [accounts, instance]);

    const selectCharacter = (char) => {
        if (!socket) return;
        socket.emit("selectCharacter", { room, character: char, username });
    };

    const setPlayerReady = () => {
        if (!socket) return;
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
                            className={`button-character ${Object.values(username).includes(char.id) ? "disabled" : ""}`}
                            onClick={() => selectCharacter(char.id)}
                            disabled={Object.values(username).includes(char.id)}
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
                            <span className="player-name">{username}</span>
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
