import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Options.css";

const Options = () => {
    const { instance, accounts } = useMsal();
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState("");
    const [userName, setUserName] = useState(""); 
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("ws://localhost:3000");
        setSocket(newSocket);

        newSocket.emit("getRooms");
        newSocket.on("roomsList", (data) => setRooms(data));

        return () => {
            newSocket.off("roomsList");
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchUserName = async () => {
            if (accounts.length === 0) {
                console.error("No hay cuentas activas en MSAL.");
                return;
            }

            try {
                const tokenResponse = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: accounts[0], // Selecciona la cuenta activa
                });

                const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                });

                setUserName(graphResponse.data.displayName);
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    try {
                        const tokenResponse = await instance.acquireTokenPopup({
                            scopes: ["User.Read"],
                        });

                        const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                        });

                        setUserName(graphResponse.data.displayName);
                    } catch (popupError) {
                        console.error("Error al obtener el nombre del usuario:", popupError);
                    }
                } else {
                    console.error("Error al obtener el nombre del usuario:", error);
                }
            }
        };

        fetchUserName();
    }, [accounts, instance]);

    const joinRoom = (room) => {
        if (!room.trim()) return; 

        socket.emit("joinRoom", room, (response) => {
            if (response?.success) {
                navigate(`/lobby/${room}`);
            } else {
                alert(response?.message || "Error al unirse a la sala.");
            }
        });
    };

    return (
        <div className="option-container"> 
            <h2 className="section-title">Bienvenido, {userName || "Cargando..."}</h2>
            <h2 className="section-title">Salas disponibles</h2>
            <div className="room-creation">
                <input
                    type="text"
                    placeholder="Nombre de la sala"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="room-input"
                />
                <button className="create-button" onClick={() => joinRoom(newRoom)}>Crear Sala</button>
            </div>
            <div className="rooms-list">
                {rooms.map((room, i) => (
                    <button className="rooms" key={i} onClick={() => joinRoom(room)}>
                        {room}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Options;