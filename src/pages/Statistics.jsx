import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../style/Staticts.css";
import Pie from "../components/Pie";
import { charactersList } from '../constants/character';
import Info from "../components/Info";
import GeneralStatistics from "../components/GeneralStatistics";
const backendApi = import.meta.env.VITE_BACKEND_URL;
const websocketApi = import.meta.env.VITE_WEBSOCKET_URL;

const Statistics = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [winners, setWinners] = useState(null);
    const [room, setRoom] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Bloquear retroceso
        const handleBack = (e) => {
            e.preventDefault();
            navigate("/options");
        };
        window.history.pushState(null, "", window.location.href);
        window.onpopstate = handleBack;

        return () => {
            window.onpopstate = null;
        };
    }, [navigate]);

    useEffect(() => {
        if (!gameId) {
            console.log("No gameId found");
            return;
        }

        fetch(`${backendApi}/games/${gameId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const userName = sessionStorage.getItem("userName");
                const player = data.players.find(p => p.username === userName);

                // Si no existe el jugador o se salió del juego, redirigir a /options
                if (!player || player.leftGame) {
                    console.warn("El jugador no participó o abandonó la partida. Redirigiendo...");
                    return navigate("/options");
                }

                setGame(data);
                const winnerPlayers = data.players.filter(p => p.winner === true);
                const winnerNames = winnerPlayers.map(winner => winner.character);
                const sortedWinners = extractAndConcatenate(winnerNames);
                setWinners(sortedWinners);
                setRoom(data.roomId);
            })
            .catch(error => {
                console.error("Error al obtener los datos:", error);
            });
    }, [gameId]);

    const extractAndConcatenate = (arr) => {
        const numbers = arr.map(item => parseInt(item.match(/\d+/)[0], 10));
        const sortedNumbers = numbers.sort((a, b) => a - b).join('');
        return sortedNumbers;
    };

    const handleLeave = async () => {
        try {
            const userName = sessionStorage.getItem("userName");
            if (!game || !userName) return navigate("/options");

            const player = game.players.find(p => p.username === userName);
            if (!player) return navigate("/options");

            const cell = game.board?.cells?.find(c => c.playerId === player.id);
            const x = cell?.x ?? 0;
            const y = cell?.y ?? 0;

            // Reconectamos al socket de forma temporal
            const socket = await import("socket.io-client").then(mod => mod.io(websocketApi));
            socket.emit("leaveGame", {
                gameId: game.id,
                playerId: player.id,
                x,
                y
            }, () => {
                socket.disconnect();
                navigate("/options");
            });

        } catch (err) {
            console.error("Error al salir del juego:", err);
            navigate("/options");
        }
    };

    if (!game) return <div>Loading...</div>;
    console.log("Sorted Winners: ", winners);

    return (
        <div className="background-statistics">

            <h1 className="title-statistics">📊 Estadísticas de la partida: {room}📈</h1>

            <GeneralStatistics game={game}/>

            <div className="players-statistics">
                <div className="graficos">
                    <div className="title-s">
                        <h2>Panel de Control Galáctico</h2>
                    </div>
                    <div className="graficosSS">
                        <div className="part">
                            <div className="statistics">
                                <h2>Desplazamientos cósmicos</h2>
                                <Pie data={game.statistics.totalMoves}/>
                            </div>
                            <div className="statistics">
                                <h2>Bajas en el Campo Estelar</h2>
                                <Pie data={game.statistics.kills}/>
                            </div>
                        </div>

                        <div className="part">
                            <div className="statistics">
                                <h2>Astronaves pulverizadas</h2>
                                <Pie data={game.statistics.totalBlocksDestroyed}/>
                            </div>
                            <div className="statistics">
                                <h2>Resistencia cósmica</h2>
                                <Pie data={game.statistics.timeAlive}/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="players-info-container">
                    <div className="title-s">
                        <h2>Burbis</h2>
                    </div>
                    <div className="players-info-containerRR">
                        {game.players.map((player) => {
                            const character = charactersList.find(
                                (c) => c.id === player.character
                            );
                            return (
                                <Info
                                    key={player.id}
                                    img={character?.emoji}
                                    value={player.username}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
            <button
                onClick={handleLeave}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold"
                }}
            >
                Salir a Opciones
            </button>
        </div>
    );
};

export default Statistics;