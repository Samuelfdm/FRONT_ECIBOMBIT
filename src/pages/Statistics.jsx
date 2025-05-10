import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../style/Staticts.css";
import { ResponsivePie } from "@nivo/pie";
import Pie from "../components/Pie";

const Statistics = () => {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);

    useEffect(() => {
        console.log("Fetching game data for ID:", gameId); // Verificamos el ID antes de hacer el fetch
    
        if (!gameId) {
            console.log("No gameId found");
            return;
        }
    
        fetch(`http://localhost:8080/games/${gameId}`)
            .then(response => {
                console.log("Response status:", response.status); // Imprimimos el código de estado de la respuesta
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Game data:", data); // Aquí verás los datos recibidos
                setGame(data);
            })
            .catch(error => {
                console.error("Error al obtener los datos:", error); // Imprime cualquier error que ocurra en el fetch
            });
    }, [gameId]);
    

    if (!game) return <div>Loading...</div>;

    return (
        <div className="background-statistics">
            <h1 className="title-statistics">📊 Estadísticas 📈</h1>

            <div className="general-statistics">
                <h2>Resumen General</h2>
                <ul>
                    <li>💣 Bombas colocadas: {game.totalBombsPlaced}</li>
                    <li>🧱 Bloques destruidos: {game.totalBlocksDestroyed}</li>
                    <li>👣 Movimientos: {game.totalMoves}</li>
                    <li>☠️ Eliminaciones: {game.kills}</li>
                </ul>
            </div>
            <div className="players-statistics">
                <div className="statistics">
                    <h2>Movimientos por jugador</h2>
                    <Pie
                                data ={game.statistics.totalMoves}
                        />


                </div>
                <div className="statistics">
                <h2>Muertes</h2>
                <Pie
                            data ={game.statistics.kills}
                    />


                </div>
            
                
                
            </div>
        
        </div>
    );
};

export default Statistics;
