import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css"
import Profile from "../components/Profile";

const Home = () => {
  const { instance} = useMsal();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await instance.loginPopup();
      navigate("/options"); 
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
      
    <div className="home_container">
      <h1 className="title">Ecibombit</h1>
      <Profile />
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
    
  );
};

export default Home;
