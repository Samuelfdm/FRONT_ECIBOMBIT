import "../style/Info.css";

function Info({img, value}) {
    return (
        <div className="info">
            <img src={img}></img>
            <h2 className="details-f">{value}</h2>  
        </div>
    );
}

export default Info;