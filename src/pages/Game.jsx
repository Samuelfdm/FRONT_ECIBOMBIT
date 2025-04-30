import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Character from "../components/Character";
import PhaserGame from "../components/Game"; 
import { useMsal } from "@azure/msal-react";
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
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const location = useLocation();
    const [config, setConfig] = useState(null);
    const [userName, setUserName] = useState(() => {
        return sessionStorage.getItem('userName') || '';
    }); 
    const [playersPanel, setPlayersPanel] = useState([]);
    const [playersGame, setPlayersGame] = useState([]); 
    const [board, setBoard] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [socket, setSocket] = useState(null);

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
        const fetchUserName = async () => {
            if (userName || sessionStorage.getItem('userName') || sessionStorage.getItem('userRegistered')) {
                return;
            }

            if (accounts.length === 0) {
                console.error("No hay cuentas activas en MSAL.");
                return;
            }

            const registerUserInBackend = async (name, email) => {
                try {
                    await axios.post("http://localhost:8080/users/login", {
                        oid: accounts[0].homeAccountId,
                        username: name,
                        email: email
                    });
                    sessionStorage.setItem('userRegistered', 'true'); // Marcar como registrado
                } catch (e) {
                    console.error("Error registrando usuario en backend:", e);
                    addAlert("Error al registrar tu sesión. Intenta de nuevo.");
                }
            };

            try {
                const tokenResponse = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: accounts[0],
                });
                const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                });
                const name = graphResponse.data.displayName;
                const email = graphResponse.data.mail || graphResponse.data.userPrincipalName;
                setUserName(name);
                localStorage.setItem('userName', name);
                await registerUserInBackend(name, email);
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    try {
                        const tokenResponse = await instance.acquireTokenPopup({
                            scopes: ["User.Read"],
                        });
                        const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                        });
                        const name = graphResponse.data.displayName;
                        const email = graphResponse.data.mail || graphResponse.data.userPrincipalName;
                        setUserName(name);
                        localStorage.setItem('userName', name);
                        await registerUserInBackend(name, email);
                    } catch (popupError) {
                        console.error("Error al obtener el nombre del usuario (popup):", popupError);
                    }
                } else {
                    console.error("Error al obtener el nombre del usuario:", error);
                }
            }
        };

        fetchUserName();
    }, [accounts,instance, userName]);

    useEffect(() => {
        const newSocket = io("ws://localhost:3000", {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
        });
    
        newSocket.on("connect", () => {
            console.log("Conectado al servidor Socket.io");
            // Asegúrate de tener los valores gameId y username antes de emitir
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
    
        setSocket(newSocket);
    
        return () => {
            if (newSocket) {
                newSocket.off("connectToGame");
                newSocket.off("connect");
                newSocket.off("connect_error");
                newSocket.off("players"); 
                newSocket.disconnect();
            }
        };
    }, [gameId, userName]); // <- Agrega gameId y username como dependencias

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
            socket.disconnect()
        };
    }, [socket, gameId, playerId, board]);

    if (!board || !board.rows || !board.columns || !board.cells) {
        return <div className="background-global">Cargando tablero...</div>;
    }

    return (
        <div className="background-global">
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
            </div>
            <div className="game-board">
                <PhaserGame 
                    board={board}
                    players={playersGame}  // Estos players ya no cambian
                    socket={socket}
                    playerId={(playersGame.find(p => p.username === userName))?.id}
                    gameId={gameId}
                />
            </div>
        </div>
    );
};

export default Game;