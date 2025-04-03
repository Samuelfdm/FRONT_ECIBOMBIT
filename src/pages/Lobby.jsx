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

// Componente para el panel de configuración
const ConfigPanel = ({ config, isOwner, onConfigChange }) => {
    if (!isOwner) {
        return (
            <div className="config-panel">
                <h3>Configuración de la Sala</h3>
                <div className="config-display">
                    <p><strong>Mapa:</strong> {config.map}</p>
                    <p><strong>Tiempo:</strong> {config.time} minutos</p>
                    <p><strong>Ítems especiales:</strong> {config.items}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="config-panel">
            <h3>Configuración de la Sala</h3>
            <div className="config-item">
                <label>Mapa:</label>
                <select
                    value={config.map}
                    onChange={(e) => onConfigChange('map', e.target.value)}
                >
                    <option value="default">Default</option>
                    <option value="map1">Mapa 1</option>
                    <option value="map2">Mapa 2</option>
                    <option value="map3">Mapa 3</option>
                </select>
            </div>
            <div className="config-item">
                <label>Tiempo (minutos):</label>
                <select
                    value={config.time}
                    onChange={(e) => onConfigChange('time', parseInt(e.target.value))}
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                </select>
            </div>
            <div className="config-item">
                <label>Ítems especiales:</label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    value={config.items}
                    onChange={(e) => onConfigChange('items', parseInt(e.target.value))}
                />
                <span>{config.items}</span>
            </div>
        </div>
    );
};

const Lobby = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    //El username se obtiene de MSAL, pero si ya fue almacenado en sessionStorage,
    //podriamos evitar hacer la solicitud al ApiGraph cada vez que el usuario entra.
    const [username, setUserName] = useState(() => {
        return sessionStorage.getItem("userName") || "";
    });
    const [players, setPlayers] = useState({});
    const [characters, setCharacters] = useState({});
    const [ready, setReady] = useState({});
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({
        map: "default",
        time: 5,
        items: 3
    });
    const [isOwner, setIsOwner] = useState(false);

    // Obtener nombre de usuario de Microsoft Graph
    useEffect(() => {
        const fetchUserName = async () => {
            if (username) return; // Evitar consulta si ya tenemos el nombre

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

                const name = graphResponse.data.displayName;
                setUserName(name);
                sessionStorage.setItem("userName", name);
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
    }, [accounts, instance, username]);

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
                    navigate('/options');
                } else {
                    console.log(`Unido a la sala ${room} como ${username}`);
                    // Verificar si es el owner
                    setIsOwner(response.isOwner);
                    // Actualizar configuración si ya existe
                    if (response.config) {
                        setConfig(response.config);
                    }
                }
            });
        });

        newSocket.on("updateLobby", (data) => {
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
            if (data.config) {
                setConfig(data.config);
            }
        });

        newSocket.on("gameStart", (gameData) => {
            console.log("¡El juego ha comenzado!", gameData);
            navigate(`/game/${room}`, {
                state: {
                    initialConfig: gameData.config,
                    players: gameData.players
                }
            });
        });

        newSocket.on("redirectToOptions", () => {
            navigate('/options');
        });

        return () => {
            console.log("Desconectando del socket...");
            if (newSocket) {
                newSocket.off("updateLobby");
                newSocket.off("gameStart");
                newSocket.off("countdownUpdate");
                newSocket.off("timeExpired");
                newSocket.off("redirectToOptions");
                newSocket.disconnect();
                setSocket(null); // Limpiar la referencia del socket
            }
        };
    }, [room, navigate, username, isLoading]);

    const selectCharacter = (char) => {
        if (!socket) return;
        console.log(`Seleccionando personaje: ${char}`);
        socket.emit("selectCharacter", { room, character: char }, (response) => {
            if (!response.success) {
                console.error("Error al seleccionar personaje:", response.message);
                alert("No se pudo seleccionar el personaje: " + response.message);
            }
        });
    };

    const setPlayerReady = () => {
        if (!socket) return;
        const newReadyState = !ready[socket.id];
        socket.emit("setReady", {
            room,
            isReady: newReadyState
        }, (response) => {
            if (!response.success) {
                console.error("Error al cambiar estado:", response.message);
            }
        });
    };

    const leaveRoom = () => {
        if (!socket || !room) return;
        console.log("Saliendo de la sala");
        socket.emit("leaveRoom", { room }, (response) => {
            if (response?.success) {
                navigate('/options');
            } else {
                console.error("Error al salir de la sala:", response?.message);
            }
        });
    };

    const handleConfigChange = (key, value) => {
        if (!socket || !isOwner) return;

        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        socket.emit("setRoomConfig", {
            room,
            config: newConfig
        }, (response) => {
            if (!response.success) {
                console.error("Error al actualizar configuración:", response.message);
                // Revertir cambios si falla
                setConfig(prev => ({ ...prev }));
            }
        });
    };

    const startGame = () => {
        if (!socket || !isOwner) return;
        socket.emit("startGame", { room }, (response) => {
            if (!response.success) {
                alert(response.message);
            }
        });
    };

    const isCharacterSelected = (charId) => {
        return characters && Object.values(characters).includes(charId);
    };

    const hasSelectedCharacter = () => {
        if (!socket) return false;
        return characters[socket.id] !== undefined;
    };

    const readyPlayersCount = Object.values(ready).filter(Boolean).length;
    const totalPlayers = Object.keys(players).length;

    if (isLoading) {
        return <div className="loading">Cargando...</div>;
    }

    return (
        <div className="lobby-container">
            <button className="leave-room-button" onClick={leaveRoom}>
                Salir de la sala
            </button>

            <h1 className="room-title">Sala {room}</h1>

            {isOwner && (
                <div className="owner-badge">
                    <span>👑 Creador de la sala</span>
                </div>
            )}

            <div className="lobby-content">
                <div className="left-panel">
                    <ConfigPanel
                        config={config}
                        isOwner={isOwner}
                        onConfigChange={handleConfigChange}
                    />

                    <div className="game-status">
                        <div className="ready-count">
                            <span>Jugadores listos:</span>
                            <span className="count">{readyPlayersCount}/{totalPlayers}</span>
                        </div>
                        {/* Botón "Listo" ahora aquí (solo para no dueños) */}
                        {!isOwner && (
                            <button
                                className={`ready-button ${ready[socket?.id] ? "active" : ""}`}
                                onClick={setPlayerReady}
                                disabled={!hasSelectedCharacter()}
                            >
                                <img src="/assets/ok.png" alt="Listo" className="ready-icon"/>
                                {ready[socket?.id] ? "¡Listo!" : "Marcar como listo"}
                            </button>
                        )}
                        {/* Botón "Iniciar Partida" (solo para dueños) */}
                        {isOwner && (
                            <button
                                className={`start-button ${readyPlayersCount >= 2 ? 'active' : ''}`}
                                onClick={startGame}
                                disabled={readyPlayersCount < 2}
                            >
                                {readyPlayersCount >= 2 ? (
                                    "¡Iniciar Partida!"
                                ) : (
                                    `Esperando ${2 - readyPlayersCount} más`
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="right-panel">
                    <div className="player-info">
                        <h2>Bienvenido, {username}</h2>
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
                            <p className="select-character-prompt">Selecciona tu personaje</p>
                        )}
                    </div>

                    <div className="characters-container">
                        <h2 className="subtitle">Selecciona tu personaje:</h2>
                        <div className="characters-grid">
                            {charactersList.map((char) => (
                                <button
                                    key={char.id}
                                    className={`character-option ${isCharacterSelected(char.id) ? "selected" : ""} ${
                                        isCharacterSelected(char.id) && characters[socket?.id] !== char.id ? "taken" : ""
                                    }`}
                                    onClick={() => selectCharacter(char.id)}
                                    disabled={isCharacterSelected(char.id) && characters[socket?.id] !== char.id}
                                >
                                    <img className="character-avatar" src={char.emoji} alt={char.name}/>
                                    <span className="character-label">{char.name}</span>
                                    {isCharacterSelected(char.id) && characters[socket?.id] !== char.id && (
                                        <span className="taken-badge">Ocupado</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="players-container">
                        <h2 className="subtitle">Jugadores en la sala:</h2>
                        <div className="players-list">
                            {Object.keys(players).map((playerId) => (
                                <div key={playerId} className={`player-card ${
                                    playerId === socket?.id ? "you" : ""
                                } ${players[playerId].isOwner ? "owner" : ""}`}>
                                    <div className="player-header">
                                    <span className="player-name">
                                        {players[playerId].username || "Jugador"}
                                        {playerId === socket?.id && " (Tú)"}
                                    </span>
                                        {players[playerId].isOwner && (
                                            <span className="owner-icon">👑</span>
                                        )}
                                    </div>
                                    <div className="player-details">
                                    <span className="character-info">
                                        {characters[playerId] ?
                                            charactersList.find(c => c.id === characters[playerId])?.name :
                                            "Sin personaje"
                                        }
                                    </span>
                                        <span className={`ready-status ${ready[playerId] ? "ready" : ""}`}>
                                        {ready[playerId] ? "✅ Listo" : "⌛ Esperando"}
                                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;