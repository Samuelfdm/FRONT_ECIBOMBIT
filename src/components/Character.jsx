import ProgressBar from "./ProgressBar";
import "../style/Character.css";

function Character({namePlayer, avatar, score, kills, bombs , max}) {
  return (
      <div className="details">
        <div className="player-img">
          <img src={avatar} alt="Player Avatar" />
        </div>
        <div className="info">
          <div className="nameUser">
            <h2>{namePlayer}</h2>
          </div>
          <div className="score">
            <h2>Puntaje: </h2>
            <span>{score}</span>
          </div>
          <div className="progress">
              <ProgressBar label="💀" value={kills} max={4} color="purple" />
              <ProgressBar label="💣" value={bombs} max={max} color="purple" />
          </div>
        </div>

      </div>
  );
}

export default Character;
