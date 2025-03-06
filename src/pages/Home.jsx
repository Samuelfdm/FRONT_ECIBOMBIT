import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await instance.loginPopup();
      navigate("/lobby"); 
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      navigate("/lobby"); 
    }
  }, [accounts, navigate]);

  return (
    <div>
      <h1>Página de Inicio</h1>
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
  );
};

export default Home;
