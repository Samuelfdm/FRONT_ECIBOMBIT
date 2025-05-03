import "../style/Character.css";

function Character({ namePlayer, avatar, score, kills, bombs, isDead }) {
    return (
        <div className={`details ${isDead ? 'dead-player' : ''}`}>
            <div className="player-img">
                <img src={avatar} alt="Player Avatar" />
            </div>
            <div className="info">
                <div className="nameUser">
                    <h2>{namePlayer}</h2>
                </div>
                <div className="progress">
                    <h2>Puntaje: </h2>
                    <span>{score}</span>
                </div>
                <div className="progress">
                    <h2>Muertes 💀: </h2>
                    <span>{kills}</span>
                </div>
                <div className="progress">
                    <h2>Arma 💣: </h2>
                    <span>{bombs}</span>
                </div>
            </div>
        </div>
    );
}

export default Character;