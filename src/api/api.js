import axios from 'axios';

const API_BASE = 'http://localhost:8080';

export const loginUser = async (user) => {
    const response = await axios.post(`${API_BASE}/users/login`, user);
    return response.data;
};

export const getGameByRoomId = async (roomId) => {
    const response = await axios.get(`${API_BASE}/games/${roomId}`);
    return response.data;
};

export const createGame = async (gameRequest) => {
    const response = await axios.post(`${API_BASE}/games/create`, gameRequest);
    return response.data;
};

export const finishGame = async (gameId, players) => {
    await axios.put(`${API_BASE}/games/${gameId}/finish`, players);
};

export const getBoardByRoomId = async (roomId) => {
    const response = await axios.get(`${API_BASE}/games/${roomId}/board`);
    return response.data;
};

export const getPlayersByRoomId = async (roomId) => {
    const response = await axios.get(`${API_BASE}/games/${roomId}/players`);
    return response.data;
};
