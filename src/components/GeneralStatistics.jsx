import "../style/GeneralStatistics.css";
import Info from "../components/Info";

function GeneralStatistics({game}) {
    return (

        <div className="general-statistics">
            <h2>Resumen General</h2>
            <div className="es">
                <Info img={"/assets/bombas.webp"} 
                  value={game.totalBombsPlaced}/>
                <Info img={"/assets/bombas.webp"} 
                    value={game.totalBombsPlaced}/>
                <Info img={"/assets/bombas.webp"} 
                    value={game.totalBombsPlaced}/>
                <Info img={"/assets/bombas.webp"} 
                    value={game.totalBombsPlaced}/>
            </div>
            

        </div>
    );
}

export default GeneralStatistics;