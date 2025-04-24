import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Options from './pages/Options';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/options" element={<PrivateRoute><Options /></PrivateRoute>} />
                <Route path="/lobby/:room" element={<PrivateRoute><Lobby /></PrivateRoute>} />
                <Route path="/game/:room" element={<PrivateRoute><Game /></PrivateRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
