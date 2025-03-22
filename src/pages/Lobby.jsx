import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Lobby.css"

const socket = io("ws://localhost:3000");

const charactersList = [
    { id: "bomber1", emoji: "/assets/character1.webp", name: "Bomber Azul" },
    { id: "bomber2", emoji: "/assets/character2.webp", name: "Bomber Rojo" },
    { id: "bomber3", emoji: "/assets/character3.webp", name: "Bomber Verde" },
    { id: "bomber4", emoji: "/assets/character4.webp", name: "Bomber Robot" },
];

const Lobby = () => {
    const { room } = useParams();
    const navigate = useNavigate();
    const [players, setPlayers] = useState({});
    const [characters, setCharacters] = useState({});
    const [ready, setReady] = useState({});

    useEffect(() => {
        socket.emit("joinRoom", room);
    
        socket.on("updateLobby", (data) => {
            setPlayers(data.players);
            setCharacters(data.characters);
            setReady(data.ready);
        });
    
        socket.on("gameStart", () => {
            console.log("Recibido evento startGame, redirigiendo...");
            navigate(`/game/${room}`);
        });
    
        return () => {
            socket.off("updateLobby");
            socket.off("gameStart"); 
        };
    }, [room, navigate]);

    const selectCharacter = (char) => {
        socket.emit("selectCharacter", { room, character: char });
    };

    const setPlayerReady = () => {
        socket.emit("setReady", room);
    };

    return (
      <div className="lobby-container">
          <h2 className="room-title">Sala {room}</h2>

          <div className="characters-container">
              <h3 className="subtitle">Selecciona tu personaje:</h3>
              <div className="characters-grid">
                  {charactersList.map((char) => (
                      <button 
                          key={char.id}
                          className={`button-character ${Object.values(characters).includes(char.id) ? "disabled" : ""}`}
                          onClick={() => selectCharacter(char.id)}
                          disabled={Object.values(characters).includes(char.id)}
                      >
                          <img className="character-img" src={char.emoji} alt={char.name} />
                      </button>
                  ))}
              </div>
          </div>

          <div className="players-container">
              <div className="players-list">
              <h3 className="subtitle">Jugadores en la sala:</h3>
                  {Object.keys(players).map((p) => (
                      <div key={p} className="player-item">
                          <span className="player-name">{p}</span>
                          <span className="player-character">{characters[p] || "Sin personaje"}</span>
                          <span className={`player-status ${ready[p] ? "ready" : "not-ready"}`}>
                              {ready[p] ? "✅ Listo" : "❌ No listo"}
                          </span>
                      </div>
                  ))}
              </div>
              <button className="ready-button" onClick={setPlayerReady}>
                <img className="ready-img" src="/assets/ok.png" />
                
              </button>
          </div>

          
      </div>
  );
};

export default Lobby;
