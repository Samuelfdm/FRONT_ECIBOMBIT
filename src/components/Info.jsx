import "../style/Info.css";

function Info({img, value}) {
    return (
        <div className="card">
          <img src={img} alt="Imagen" className="card-image" />
          <p className="card-text">{value}</p>
        </div>
      );
    };

export default Info;