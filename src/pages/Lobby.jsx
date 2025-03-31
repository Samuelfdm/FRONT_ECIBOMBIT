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
    const [isLoading, setIsLoading] = useState(true);

    // Obtener nombre de usuario de Microsoft Graph
    useEffect(() => {
        const fetchUserName = async () => {
            if (accounts.length === 0) {
                console.error("No hay cuentas activas en MSAL.");
                return;
            }

            try {
                const tokenResponse = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: accounts[0],
                });

                const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                });

                setUserName(graphResponse.data.displayName);
                setIsLoading(false);
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
                        setIsLoading(false);
                    } catch (popupError) {
                        console.error("Error al obtener el nombre del usuario:", popupError);
                        setIsLoading(false);
                    }
                } else {
                    console.error("Error al obtener el nombre del usuario:", error);
                    setIsLoading(false);
                }
            }
        };

        fetchUserName();
    }, [accounts, instance]);

    // Configurar socket y unirse a la sala cuando tengamos el nombre de usuario
    useEffect(() => {
        if (isLoading || !username) return;

        const newSocket = io("ws://localhost:3000");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Conectado al servidor con ID:", newSocket.id);
            
            // Unirse a la sala enviando el nombre de usuario
            newSocket.emit("joinRoom", { room, username }, (response) => {
                if (!response.success) {
                    console.error(response.message);
                    navigate('/');
                } else {
                    console.log(`Unido a la sala ${room} como ${username}`);
                }
            });
        });

        newSocket.on("updateLobby", (data) => {
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
        });

        newSocket.on("gameStart", (playersData) => {
            console.log("¡El juego ha comenzado!", playersData);
            navigate(`/game/${room}`);
        });

        return () => {
            console.log("Desconectando del socket...");
            newSocket.off("updateLobby");
            newSocket.off("gameStart");
            newSocket.disconnect();
        };
    }, [room, navigate, username, isLoading]);

    const selectCharacter = (char) => {
        if (!socket) return;
        console.log(`Seleccionando personaje: ${char}`);
        socket.emit("selectCharacter", { room, character: char });
    };

    const setPlayerReady = () => {
        if (!socket) return;
        console.log("Marcando como listo");
        socket.emit("setReady", room);
    };

    // Determinar si un personaje ya está seleccionado por algún jugador
    const isCharacterSelected = (charId) => {
        return Object.values(characters).includes(charId);
    };

    // Determinar si el jugador actual ya ha seleccionado un personaje
    const hasSelectedCharacter = () => {
        if (!socket) return false;
        return characters[socket.id] !== undefined;
    };

    if (isLoading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="lobby-container">
            <h2 className="room-title">Sala {room}</h2>
            
            <div className="player-info">
                <h3>Bienvenido, {username}</h3>
                {hasSelectedCharacter() ? (
                    <div className="selected-character">
                        <p>Tu personaje: {charactersList.find(c => c.id === characters[socket?.id])?.name}</p>
                        <img 
                            src={charactersList.find(c => c.id === characters[socket?.id])?.emoji} 
                            alt="Tu personaje" 
                            className="character-preview"
                        />
                    </div>
                ) : (
                    <p>Selecciona un personaje para comenzar</p>
                )}
            </div>

            <div className="characters-container">
                <h3 className="subtitle">Selecciona tu personaje:</h3>
                <div className="characters-grid">
                    {charactersList.map((char) => (
                        <button 
                            key={char.id}
                            className={`button-character ${isCharacterSelected(char.id) ? "disabled" : ""}`}
                            onClick={() => selectCharacter(char.id)}
                            disabled={isCharacterSelected(char.id) && characters[socket?.id] !== char.id}
                        >
                            <img className="character-img" src={char.emoji} alt={char.name} />
                            <span className="character-name">{char.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="players-container">
                <h3 className="subtitle">Jugadores en la sala:</h3>
                <div className="players-list">
                    {Object.keys(players).map((playerId) => (
                        <div key={playerId} className="player-item">
                            <span className="player-name">
                                {players[playerId].username || "Jugador desconocido"}
                                {socket && playerId === socket.id ? " (Tú)" : ""}
                            </span>
                            <span className="player-character">
                                {characters[playerId] ? 
                                    charactersList.find(c => c.id === characters[playerId])?.name : 
                                    "Sin personaje"
                                }
                            </span>
                            <span className={`player-status ${ready[playerId] ? "ready" : "not-ready"}`}>
                                {ready[playerId] ? "✅ Listo" : "❌ No listo"}
                            </span>
                        </div>
                    ))}
                </div>
                
                <button 
                    className="ready-button" 
                    onClick={setPlayerReady}
                    disabled={!hasSelectedCharacter() || (socket && ready[socket.id])}
                >
                    <img className="ready-img" src="/assets/ok.png" alt="Listo" />
                    <span>¡Estoy listo!</span>
                </button>
            </div>
        </div>
    );
};

export default Lobby;