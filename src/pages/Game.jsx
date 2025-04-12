import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Character from "../components/Character";
import "../style/Global.css";
import "../style/Game.css";

const charactersList = [
    { id: "bomber1", emoji: "/assets/character1.webp", name: "Bomber Verde" },
    { id: "bomber2", emoji: "/assets/character2.webp", name: "Bomber Naranja" },
    { id: "bomber3", emoji: "/assets/character3.webp", name: "Bomber Azul" },
    { id: "bomber4", emoji: "/assets/character4.webp", name: "Bomber Morado" },
];

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

    if (!board || !board.rows || !board.columns || !board.cells) {
        return <div className="background-global">Cargando tablero...</div>;
    }

    return (
        <div className="background-global">
            <div className="playersPanel">
                {players.map(player => {
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
                            max={config?.items}
                        />
                    );
                })}
            </div>
            <div className="game-board">
                {Array.from({length: board.rows}).flatMap((_, y) =>
                    Array.from({length: board.columns}).map((_, x) => {
                        const cell = board.cells.find(c => c.x === x && c.y === y) || {type: "EMPTY"};
                        const className = `cell ${cell.type.toLowerCase()}`;

                        return (
                            <div key={`${x}-${y}`} className={className}>
                                {cell.type === "PLAYER" && "🧍"}
                                {cell.type === "ITEM" && "🎁"}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Game;
