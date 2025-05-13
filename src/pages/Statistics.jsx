import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../style/Staticts.css";
import Pie from "../components/Pie";
import { charactersList } from '../constants/character';
import Info from "../components/Info";

import GeneralStatistics from "../components/GeneralStatistics";

const Statistics = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [winners, setWinners] = useState(null);
    const [room, setRoom] = useState(null);
    

    useEffect(() => {
        if (!gameId) {
            console.log("No gameId found");
            return;
        }
        fetch(`http://localhost:8080/games/${gameId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
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

    function extractAndConcatenate(arr) {
        const numbers = arr.map(item => parseInt(item.match(/\d+/)[0], 10));
        const sortedNumbers = numbers.sort((a, b) => a - b).join('');
        return sortedNumbers;
    }

    if (!game) return <div>Loading...</div>;
    console.log(game)

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
                    <div className="part">
                        <div className="statistics">
                            <h2>Movimientos por jugador</h2>
                            <Pie data={game.statistics.totalMoves} />
                        </div>
                        <div className="statistics">
                            <h2>Bajas en el Campo Estelar</h2>
                            <Pie data={game.statistics.kills} />
                        </div>
                    </div>

                    <div className="part">
                        <div className="statistics">
                            <h2>Efectividad de las bombas</h2>
                            <Pie data={game.statistics.totalBlocksDestroyed} />
                        </div>
                        <div className="statistics">
                            <h2>Muertes</h2>
                            <Pie data={game.statistics.kills} />
                        </div>
                    </div>

                </div>
                <div className="players-info-container">
                    <div className="title-s">
                        <h2>Burbis</h2>
                    </div>
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
    );
};

export default Statistics;
