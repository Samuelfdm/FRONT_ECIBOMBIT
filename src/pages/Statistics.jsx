import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../style/Staticts.css";
import Pie from "../components/Pie";
import GeneralStatistics from "../components/GeneralStatistics";

const Statistics = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [winners, setWinners] = useState(null);

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

    console.log("Sorted Winners: ", winners);

    return (
        <div className="background-statistics">
            <h1 className="title-statistics">📊 Estadísticas 📈</h1>
            <h2>Resumen General</h2>
            <GeneralStatistics game={game}/>
            <div className="players-statistics">
                <div className="statistics">
                    <h2>Movimientos por jugador</h2>
                    <Pie data={game.statistics.totalMoves} />
                </div>
                <div className="statistics">
                    <h2>Muertes</h2>
                    <Pie data={game.statistics.kills} />
                </div>
            </div>
        </div>
    );
};

export default Statistics;
