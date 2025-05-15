import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../style/Staticts.css";
import Pie from "../components/Pie";
import { charactersList } from '../constants/character';
import { charactersListWinners } from '../constants/characterWinners';
import Info from "../components/Info";
import GeneralStatistics from "../components/GeneralStatistics";

const backendApi = 'http://localhost:8080';
// const backendApi = 'https://backend.proudwave-8afe962a.eastus.azurecontainerapps.io';

const Statistics = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [winners, setWinners] = useState(null);
    const [room, setRoom] = useState(null);
    const [winnerEmoji, setWinnerEmoji] = useState(null); // ✅ new state

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
                setGame(data);

                // ✅ process winners
                const winnerPlayers = data.players.filter(p => p.winner === true);
                const winnerNames = winnerPlayers.map(winner => winner.character);
                const numbers = winnerNames.map(item => parseInt(item.match(/\d+/)[0], 10));
                const sortedNumbers = numbers.sort((a, b) => a - b).join('');
                setWinners(sortedNumbers);
                setRoom(data.roomId);

                // ✅ find and set winner emoji
                const winner = charactersListWinners.find(c => c.id === String(sortedNumbers));
                setWinnerEmoji(winner ? winner.emoji : null);
            })
            .catch(error => {
                console.error("Error al obtener los datos:", error);
            });
    }, [gameId]);

    if (!game) return <div>Loading...</div>;

    return (
        <div className="background-statistics">
            <h1 className="title-statistics">📊 Estadísticas de la partida: {room}📈</h1>

            <GeneralStatistics game={game} winner={winnerEmoji} />

            <div className="players-statistics">
                <div className="graficos">
                    <div className="title-s">
                        <h2>Panel de Control Galáctico</h2>
                    </div>
                    <div className="graficosSS">
                        <div className="part">
                            <div className="statistics">
                                <h2>Desplazamientos cósmicos</h2>
                                <Pie data={game.statistics.totalMoves} />
                            </div>
                            <div className="statistics">
                                <h2>Bajas en el Campo Estelar</h2>
                                <Pie data={game.statistics.kills} />
                            </div>
                        </div>

                        <div className="part">
                            <div className="statistics">
                                <h2>Astronaves pulverizadas</h2>
                                <Pie data={game.statistics.totalBlocksDestroyed} />
                            </div>
                            <div className="statistics">
                                <h2>Resistencia cósmica</h2>
                                <Pie data={game.statistics.timeAlive} />
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
        </div>
    );
};

export default Statistics;
