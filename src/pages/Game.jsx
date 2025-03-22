import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const Game = () => {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // Recibe la lista de jugadores cuando el juego inicia
        socket.on("gameStart", ({ players }) => {
            setPlayers(players);
        });

        return () => {
            socket.off("gameStart");
        };
    }, []);

    return (
        <div className="game-container">
            {/* Sección de jugadores */}
            <div className="players-panel">
                {players.map((player, index) => (
                    <div key={player.id} className="player-card">
                        <img src={player.character} alt={`Player ${index + 1}`} />
                        <div className="player-info">
                            <h3>Puntaje</h3>
                            <p>// {player.score ?? "--"}</p>
                            <div className="stats">
                                <span>💣 {player.bombs ?? 0}</span>
                                <span>🔥 {player.fire ?? 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Espacio para el tablero */}
            <div className="game-board">
                {/* Aquí irá el juego de Bomberman */}
            </div>
        </div>
    );
};

export default Game;
