import React, {useEffect, useRef, useState} from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import axios from "axios";
import { charactersList } from '../constants/character';
import "../style/Global.css";
import "../style/Lobby.css";
const websocketApi = import.meta.env.VITE_WEBSOCKET_URL;

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
                {isOwner ? (
                    <>
                        <label htmlFor="map-select">Mapa:</label>
                        <select
                            id="map-select"
                            value={config.map}
                            onChange={(e) => onConfigChange("map", e.target.value)}
                        >
                            <option value="default">Default</option>
                            <option value="map1">Mapa 1</option>
                            <option value="map2">Mapa 2</option>
                            <option value="map3">Mapa 3</option>
                        </select>
                    </>
                ) : (
                    <>
                        <label>Mapa:</label>
                        <p><strong>Mapa:</strong> {config.map}</p>
                    </>
                )}
            </div>
            <div className="config-item">
                {isOwner ? (
                    <>
                        <label htmlFor="time-select">Tiempo (minutos):</label>
                        <select
                            id="time-select"
                            value={config.time}
                            onChange={(e) => onConfigChange('time', parseInt(e.target.value))}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </>
                ) : (
                    <>
                        <p id="config-time"><strong>Tiempo:</strong> {config.time}</p>
                    </>
                )}
            </div>
            <div className="config-item">
                {isOwner ? (
                    <>
                        <label htmlFor="items-range">Ítems especiales:</label>
                        <input
                            id="items-range"
                            type="range"
                            min="0"
                            max="5"
                            value={config.items}
                            onChange={(e) => onConfigChange('items', parseInt(e.target.value))}
                        />
                    </>
                ) : (
                    <>
                        <label htmlFor="config-items">Ítems especiales:</label>
                        <span id="config-items">{config.items}</span>
                    </>
                )}
            </div>
        </div>
    );
};

const Lobby = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [username, setUserName] = useState(() => {
        return sessionStorage.getItem("userName") || "";
    });    
    const [players, setPlayers] = useState({});
    const [characters, setCharacters] = useState({});
    const [ready, setReady] = useState({});
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const DEFAULT_CONFIG = {
        map: "default",
        time: 5,
        items: 3
    };
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [isOwner, setIsOwner] = useState(false);
    const socketRef = useRef(null);

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
        if (!username) return;
        if (socketRef.current) return;
        console.log("VALOR OBTENIDO DE LA WEBSOCKETAPI LOBBY: "+websocketApi);
        const newSocket = io(websocketApi, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        const handleConnect = () => {
            console.log("Conectado al servidor con ID:", newSocket.id);
            // Unirse a la sala enviando el nombre de usuario
            newSocket.emit("joinRoom", { room, username }, (response) => {
                if (!response?.success) {
                    console.error(response?.message || "Error al unirse a la sala");
                    navigate('/options');
                    return;
                }
                console.log(`Unido a la sala ${room} como ${username}`);
                // Verificar si es el owner
                setIsOwner(response.isOwner);
                // Actualizar configuración si ya existe
                if (response.config) {
                    setConfig(response.config);
                }
                setIsLoading(false);
            });
        };

        const handleUpdateLobby = (data) => {
            if (!data?.players || !data?.characters || !data?.ready) {
                console.warn("Datos de la sala incompletos");
                navigate('/options');
                return;
            }
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
            if (data.config) {
                setConfig(data.config);
            }
            setIsLoading(false);
        };

        const handleRoomClosed = (data) => {
            console.log(data?.message || "Sala cerrada por el servidor");
            navigate('/options');
        };

        // Configurar listeners
        newSocket.on("connect", handleConnect);
        newSocket.on("redirect", ({ to }) => {navigate(to);});
        newSocket.on("updateLobby", handleUpdateLobby);
        newSocket.on("roomClosed", handleRoomClosed);
        newSocket.on("gameStart", (gameData) => {
            console.log("¡El juego ha comenzado!", gameData);
            navigate(`/game/${room}`, {
                state: {
                    initialConfig: gameData.config,
                    players: gameData.players,
                    board: gameData.board,
                    gameId: gameData.gameId
                }
            });
        });

        return () => {
            console.log("Limpiando conexión socket...");
            if (socketRef.current) {
                socketRef.current.off("connect", handleConnect);
                socketRef.current.off("updateLobby", handleUpdateLobby);
                socketRef.current.off("roomClosed", handleRoomClosed);
                socketRef.current.off("gameStart");
                socketRef.current.off("redirect");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [room, navigate, username]);

    const selectCharacter = (char) => {
        if (!socket?.connected) {
            alert("Conexión no disponible");
            return;
        }
        socket.emit("selectCharacter", { room, character: char }, (response) => {
            if (!response?.success) {
                alert(response?.message || "Error al seleccionar personaje");
            }
        });
    };

    const setPlayerReady = () => {
        if (!socket?.connected) {
            alert("Conexión no disponible");
            return;
        }
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
        if (!socket?.connected || !room) {
            alert("Conexión no disponible");
            navigate('/options');
            return;
        }
        socket.emit("leaveRoom", { room }, (response) => {
            console.log("Respuesta del servidor:", response);
            navigate('/options');  // Redirigir siempre, independientemente de la respuesta
        });
    };

    const handleConfigChange = (key, value) => {
        if (!socket || !isOwner) return;

        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        socket.emit("setRoomConfig", {
            room,
            //config: newConfig
            ...newConfig  // Enviar los valores directamente en lugar de anidarlos en "config"
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

        const readyPlayerIds = Object.keys(ready).filter((id) => ready[id]);
        if (readyPlayerIds.length < 2) {
            alert("Se necesitan al menos 2 jugadores listos para iniciar.");
            return;
        }

        const gamePayload = {
            room,
            config,
            players: readyPlayerIds.map((id) => ({
                id,
                username: players[id]?.username || "Jugador",
                character: characters[id] || "default"
            }))
        };

        const jwtToken = sessionStorage.getItem("jwtToken");
        console.log(jwtToken);
        socket.emit("startGame", gamePayload, jwtToken, (response) => {
            if (!response?.success) {
                alert(response.message || "No se pudo iniciar el juego.");
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
        <div className="background-lobby">
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
                        {/* Botón "Listo" ahora aquí PARA EL DUEÑO Y NO DUEÑOS */}
                        <button
                            className={`ready-button ${ready[socket?.id] ? "active" : ""}`}
                            onClick={setPlayerReady}
                            disabled={!hasSelectedCharacter()}
                        >
                            <img src="/assets/ok.png" alt="Listo" className="ready-icon"/>
                            {ready[socket?.id] ? "¡Listo!" : "Marcar como listo"}
                        </button>
                        {/* Botón "Iniciar Partida" (solo para dueños) */}
                        {isOwner && (
                            <button
                                className={`start-button ${readyPlayersCount >= 2 ? 'active' : ''}`}
                                onClick={startGame}
                                disabled={readyPlayersCount < 2 || !ready[socket?.id]}
                            >
                                {(readyPlayersCount >= 2 && ready[socket?.id]) ? (
                                    "¡Iniciar Partida!"
                                ) : (
                                    readyPlayersCount < 2
                                        ? `Esperando ${2 - readyPlayersCount} más`
                                        : "Marca listo para iniciar"
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