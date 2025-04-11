import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import "../style/Global.css";
import "../style/Home.css";
import Profile from "../components/Profile";

const Home = () => {
  const { instance} = useMsal();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await instance.loginPopup({
        scopes: ["User.Read"], // Permisos requeridos para obtener el perfil del usuario
      });
      navigate("/options");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("No se pudo iniciar sesión. Verifica tu conexión e intenta de nuevo.");
    }
  };

  return (
      
    <div className="background-home">
      <h1 className="title">Ecibombit</h1>
      <Profile />
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
    
  );
};

export default Home;
