import "../style/Info.css";

function Winner({img}) {
    return (
        <div className="card-winner">
          <img src={img} alt="Imagen" className="card-image-Winner" />
        </div>
      );
    };

export default Winner;