import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const Game = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [config, setConfig] = useState(null);
    const [players, setPlayers] = useState([]);
    const [board, setBoard] = useState(null);
    const [gameId, setGameId] = useState(null);

    useEffect(() => {
        if (!location.state) {
            console.error("No se proporcionaron datos del juego.");
            navigate("/options");
            return;
        }

        setConfig(location.state.initialConfig);
        setPlayers(location.state.players);
        setBoard(location.state.board);
        setGameId(location.state.gameId);
    }, [location, navigate]);

    if (!config || !board) return <div>Cargando juego...</div>;

    return (
        <div>
            <h2>Partida en Sala: {room}</h2>
            <h3>Game ID: {gameId}</h3>
            <div>
                <strong>Configuración:</strong> {JSON.stringify(config)}
            </div>
            <div>
                <strong>Jugadores:</strong>
                <ul>
                    {players.map((p) => (
                        <li key={p.username}>{p.username} - {p.character}</li>
                    ))}
                </ul>

            </div>
            <div>
                <strong>Tablero:</strong>
                <pre>{JSON.stringify(board, null, 2)}</pre>
            </div>
        </div>
    );
};

export default Game;