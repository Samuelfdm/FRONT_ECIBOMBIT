import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Character from "../components/Character";
import PhaserGame from "../components/Game";
import { io } from "socket.io-client";
import "../style/Global.css";
import "../style/Game.css";

const charactersList = [
    { id: "bomber1", emoji: "/assets/character1.webp", name: "Bomber Verde" },
    { id: "bomber2", emoji: "/assets/character2.webp", name: "Bomber Naranja" },
    { id: "bomber3", emoji: "/assets/character3.webp", name: "Bomber Azul" },
    { id: "bomber4", emoji: "/assets/character4.webp", name: "Bomber Morado" },
];

const Game = () => {
    const navigate = useNavigate();
    const [gameTimeLeft, setGameTimeLeft] = useState(null);
    const location = useLocation();
    const [config, setConfig] = useState(null);
    const [userName, setUserName] = useState(() => {
        return sessionStorage.getItem('userName') || '';
    }); 
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [startCountdown, setStartCountdown] = useState(null);
    const [playersPanel, setPlayersPanel] = useState([]);
    const [playersGame, setPlayersGame] = useState([]); 
    const [board, setBoard] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [socket, setSocket] = useState(null);

    const formatTime = (seconds) => {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        return `${minutes}:${secs}`;
    };

    useEffect(() => {
        if (!location.state) {
            console.error("No se proporcionaron datos del juego.");
            navigate("/options");
            return;
        }
        setConfig(location.state.initialConfig);
        setPlayersPanel(location.state.players);
        setPlayersGame(location.state.players); 
        setBoard(location.state.board);
        setGameId(location.state.gameId);
    }, [location, navigate]);

    useEffect(() => {
        const newSocket = io("ws://localhost:3000", {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    
        newSocket.on("connect", () => {
            console.log("Conectado al servidor Socket.io");
            if (gameId && userName) {
                newSocket.emit("connectToGame", { gameId, username: userName }, (response) => {
                    if (response.success) {
                        console.log("Conectado al juego con éxito");
                    } else {
                        console.error("Error al conectar al juego:", response.message);
                    }
                });
            }
        });

        newSocket.on("players", (updatedPlayers) => {
            console.log("Recibidos nuevos players:", updatedPlayers);
            setPlayersPanel(updatedPlayers);
        });
    
        newSocket.on("connect_error", (err) => {
            console.error("Error de conexión:", err);
        });
    
        newSocket.on("startTimerGame", ({ countdown }) => {
            let time = countdown;
            setStartCountdown(time);
            const countdownInterval = setInterval(() => {
                time -= 1;
                setStartCountdown(time);
                if (time === 0) {
                    clearInterval(countdownInterval);
                    setIsGameStarted(true);
                    setStartCountdown(null);
                }
            }, 1000);
        });

        newSocket.on("gameTimerTick", ({ timeLeft }) => {
            setGameTimeLeft(timeLeft);
        });


        

        setSocket(newSocket);
    
        return () => {
            if (newSocket) {
                newSocket.off("connect");
                newSocket.off("players");
                newSocket.off("startTimerGame");
                newSocket.off("gameTimerTick");
                newSocket.off("playerDied");
                newSocket.off("connect_error");
                newSocket.disconnect();
            }
        };
    }, [gameId, userName]);

    useEffect(() => {
        const handlePopState = () => {
            const cell = board?.cells?.find(c => c.playerId === playerId);
            const x = cell?.x ?? 0;
            const y = cell?.y ?? 0;
            if (socket && gameId && playerId) {
                socket.emit("leaveGame", { gameId, playerId, x, y });
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
            if (socket) {
                socket.emit("leaveGame", {
                    gameId,
                    playerId,
                    x: 0,
                    y: 0
                });
            }
        };
    }, [socket, gameId, playerId, board]);

    if (!board || !board.rows || !board.columns || !board.cells) {
        return <div className="background-global">Cargando tablero...</div>;
    }

    return (
        <div className="background-global">
            {startCountdown !== null && (
                <div className="countdown-overlay">
                    <h1>{startCountdown}</h1>
                </div>
            )}
            <div className="playersPanel">
                {playersPanel.map(player => {
                    const characterData = charactersList.find(
                        character => character.id === player.character
                    );
                    return (
                        <Character
                            key={player.id}
                            namePlayer={player.username}
                            avatar={characterData?.emoji}
                            score={player.score}
                            kills={player.kills}
                            bombs={player.bombs}
                            isDead={player.dead}
                        />
                    );
                })}

                {gameTimeLeft !== null && (
                    <div className="timer-box">
                        <span>{formatTime(gameTimeLeft)}</span>
                    </div>
                )}

            </div>
            <div className="game-board">
                <PhaserGame 
                    key={isGameStarted ? 'game-started' : 'waiting'}
                    board={board}
                    players={playersGame}
                    socket={socket}
                    playerId={(playersGame.find(p => p.username === userName))?.id}
                    gameId={gameId}
                    isGameStarted={isGameStarted}
                />

            </div>
        </div>
    );
};

export default Game;