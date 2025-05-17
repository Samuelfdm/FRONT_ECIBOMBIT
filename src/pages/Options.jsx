import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Alert from "../components/Alert";
import "../style/Global.css";
import "../style/Options.css";
const backendApi = import.meta.env.VITE_BACKEND_URL;
const websocketApi = import.meta.env.VITE_WEBSOCKET_URL;

const Options = () => {
    const { instance, accounts } = useMsal();
    const [roomsData, setRoomsData] = useState([]); // Cambiamos 'rooms' a 'roomsData' para almacenar más info
    const [newRoom, setNewRoom] = useState("");
    const [userName, setUserName] = useState(() => {
        return sessionStorage.getItem('userName') || '';
    });
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    // Función para cerrar sesión
    const handleLogout = () => {
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userRegistered');
        instance.logoutPopup({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/"
        }).then(() => {
            navigate('/');
        }).catch(error => {
            console.error("Error al cerrar sesión:", error);
            addAlert("Error al cerrar sesión");
        });
    };

    const addAlert = (message, type = 'error') => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeAlert(id);
        }, 5000);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    useEffect(() => {
        console.log("VALOR OBTENIDO DE LA WEBSOCKETAPI OPTIONS: "+websocketApi);
        const newSocket = io(websocketApi, {
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
        });

        newSocket.on("connect", () => {
            console.log("Conectado al servidor Socket.io");
            setIsLoading(false);
        });

        newSocket.on("connect_error", (err) => {
            console.error("Error de conexión:", err);
            addAlert("No se pudo conectar al servidor del juego");
            setIsLoading(false);
        });

        newSocket.emit("getRooms");
        newSocket.on("roomsList", (data) => {
            setRoomsData(data); // Ahora 'data' contendrá un array de objetos { name, playerCount }
            setIsLoading(false);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.off("roomsList");
                newSocket.off("connect");
                newSocket.off("connect_error");
                newSocket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        const fetchUserName = async () => {
            // Comprueba si ya tenemos el nombre de usuario en estado o almacenamiento
            const storedUserName = sessionStorage.getItem('userName');
            const userRegistered = sessionStorage.getItem('userRegistered');

            // Si ya tenemos la información, no necesitamos hacer nada
            if (userName || storedUserName || userRegistered) {
                console.log("Usuario ya registrado, evitando re-fetch");
                if (storedUserName && !userName) {
                    setUserName(storedUserName);
                }
                return;
            }

            if (accounts.length === 0) {
                console.error("No hay cuentas activas en MSAL.");
                return;
            }

            const registerUserInBackend = async (name, email) => {
                try {
                    console.log("Registrando usuario en backend");
                    const jwtResponse = await axios.post(`${backendApi}/users/login`, {
                        oid: accounts[0].homeAccountId,
                        username: name,
                        email: email
                    });

                    //  Guardar el token que crea tu backend
                    const jwtToken = jwtResponse.data.token;
                    sessionStorage.setItem("jwtToken", jwtToken);
                    sessionStorage.setItem('userRegistered', 'true'); // Marcar como registrado
                    sessionStorage.setItem('userName', name); // Guardar también en sessionStorage
                } catch (e) {
                    console.error("Error registrando usuario en backend:", e);
                    addAlert("Error al registrar tu sesión. Intenta de nuevo.");
                }
            };

            try {
                console.log("Intentando obtener token silenciosamente");
                const tokenResponse = await instance.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: accounts[0],
                });

                const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                    headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                });

                const name = graphResponse.data.displayName;
                const email = graphResponse.data.mail || graphResponse.data.userPrincipalName;

                setUserName(name);
                sessionStorage.setItem('userName', name); // Usar sessionStorage en lugar de localStorage

                await registerUserInBackend(name, email);
            } catch (error) {
                if (error instanceof InteractionRequiredAuthError) {
                    try {
                        console.log("Requiere interacción, abriendo popup");
                        const tokenResponse = await instance.acquireTokenPopup({
                            scopes: ["User.Read"],
                        });

                        const graphResponse = await axios.get("https://graph.microsoft.com/v1.0/me", {
                            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
                        });

                        const name = graphResponse.data.displayName;
                        const email = graphResponse.data.mail || graphResponse.data.userPrincipalName;

                        setUserName(name);
                        sessionStorage.setItem('userName', name); // Usar sessionStorage en lugar de localStorage

                        await registerUserInBackend(name, email);
                    } catch (popupError) {
                        console.error("Error al obtener el nombre del usuario (popup):", popupError);
                        addAlert("Error al obtener tu nombre de usuario");
                    }
                } else {
                    console.error("Error al obtener el nombre del usuario:", error);
                    addAlert("Error al obtener tu nombre de usuario");
                }
            }
        };

        fetchUserName();

        // Esta bandera nos ayuda a evitar una segunda ejecución del efecto
        return () => {
            console.log("Limpieza del efecto fetchUserName");
        };
    }, []);

    const createRoom = (room) => {
        if (!room.trim()) {
            addAlert("El nombre de la sala no puede estar vacío");
            return;
        }

        if (!userName) {
            addAlert("No se pudo obtener tu nombre de usuario");
            return;
        }

        setIsLoading(true);

        socket.emit("createRoom", { roomName: room, username: userName }, (response) => {
            if (response?.success) {
                navigate(`/lobby/${room}`);
            } else {
                if (response?.currentRoom) {
                    addAlert(response.message, 'info');
                    navigate(`/lobby/${response.currentRoom}`);
                } else {
                    addAlert(response?.message || "Error al unirse a la sala");
                }
            }
            setIsLoading(false);
        });
    };

    const joinRoom = (roomName) => {
        navigate(`/lobby/${roomName}`);
    };

    return (
        <div className="background-options">
            <div className="header-section">
                <h1 className="section-titles">Bienvenido, {userName || "Cargando..."}</h1>
                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Cerrar sesión
                </button>
            </div>

            <h2 className="section-title">Salas disponibles</h2>

            {alerts.map(alert => (
                <Alert
                    key={alert.id}
                    message={alert.message}
                    type={alert.type}
                    onClose={() => removeAlert(alert.id)}
                />
            ))}

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
                    onClick={() => createRoom(newRoom)}
                    disabled={isLoading || !newRoom.trim()}
                >
                    {isLoading ? "Cargando..." : "Crear Sala"}
                </button>
            </div>

            {isLoading ? (
                <div className="loading">Cargando salas...</div>
            ) : (
                <div className="rooms-list">
                    {roomsData.length > 0 ? (
                        roomsData.map((roomInfo) => (
                            <div key={roomInfo.name} className="room-item">
                                <button
                                    className="rooms"
                                    onClick={() => joinRoom(roomInfo.name)}
                                    disabled={isLoading || roomInfo.playerCount >= 4} // Deshabilitar si la sala está llena
                                >
                                    {roomInfo.name} ({roomInfo.playerCount}/4)
                                </button>
                                {roomInfo.playerCount >= 4 && (
                                    <span className="full-room-indicator">(Llena)</span>
                                )}
                            </div>
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