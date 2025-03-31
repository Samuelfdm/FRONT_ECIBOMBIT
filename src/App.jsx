import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Options from './pages/Options';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/options" element={<Options />} />
                <Route path="/lobby/:room" element={<Lobby />} />
                <Route path="/game/:room" element={<Game />} />
            </Routes>
        </Router>
    );
}

export default App;