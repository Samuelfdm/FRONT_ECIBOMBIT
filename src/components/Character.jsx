import ProgressBar from "./ProgressBar";
import "../style/Character.css";

function Character({ avatar, score, diamonds, bombs , max}) {
  return (
    <div className="container-player">
      <div className="player-img">
        <img src={avatar} alt="Player Avatar" />
      </div>
      <div className="info">
        <div className="score">
          <h2>Puntaje</h2>
          <span>{score}</span>
        </div>
        <div className="progress">
            <ProgressBar label="💣" value={bombs} max={max} color="purple" />
            <ProgressBar label="💣" value={bombs} max={max} color="purple" />
        </div>
      </div>
    </div>
  );
}

export default Character;
