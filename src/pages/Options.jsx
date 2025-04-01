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
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io("ws://localhost:3000", {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
        });

        newSocket.on("connect", () => {
            console.log("Conectado al servidor Socket.io");
            setIsLoading(false);
        });

        newSocket.on("connect_error", (err) => {
            console.error("Error de conexión:", err);
            setError("No se pudo conectar al servidor del juego");
            setIsLoading(false);
        });

        newSocket.emit("getRooms");
        newSocket.on("roomsList", (data) => {
            setRooms(data);
            setIsLoading(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.off("roomsList");
            newSocket.off("connect");
            newSocket.off("connect_error");
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
                    account: accounts[0],
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
        if (!room.trim()) {
            setError("El nombre de la sala no puede estar vacío");
            return;
        }

        if (!userName) {
            setError("No se pudo obtener tu nombre de usuario");
            return;
        }

        setError(null);
        setIsLoading(true);

        socket.emit("joinRoom", { room, username: userName }, (response) => {
            setIsLoading(false);
            
            if (response?.success) {
                navigate(`/lobby/${room}`);
            } else {
                setError(response?.message || "Error al unirse a la sala");
            }
        });
    };

    return (
        <div className="option-container"> 
            <h2 className="section-title">Bienvenido, {userName || "Cargando..."}</h2>
            <h2 className="section-title">Salas disponibles</h2>
            
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="room-creation">
                <input
                    type="text"
                    placeholder="Nombre de la sala"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="room-input"
                    disabled={isLoading}
                />
                <button 
                    className="create-button" 
                    onClick={() => joinRoom(newRoom)}
                    disabled={isLoading || !newRoom.trim()}
                >
                    {isLoading ? "Cargando..." : "Crear Sala"}
                </button>
            </div>

            {isLoading ? (
                <div className="loading">Cargando salas...</div>
            ) : (
                <div className="rooms-list">
                    {rooms.length > 0 ? (
                        rooms.map((room, i) => (
                            <button 
                                className="room-button" 
                                key={i} 
                                onClick={() => joinRoom(room)}
                                disabled={isLoading}
                            >
                                {room}
                            </button>
                        ))
                    ) : (
                        <p className="no-rooms">No hay salas disponibles</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Options;