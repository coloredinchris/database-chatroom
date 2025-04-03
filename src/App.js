import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
import Home from './pages/Home';
import ColorGame from './pages/ColorGame';
import AdvGameProgramming from './pages/AdvGameProgramming';
import ChatRoom from './pages/ChatRoom';
import ColorGameV2 from './pages/ColorGameV2';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/color-game" element={<ColorGame/>} />
        <Route path="/ColorGameV2" element={<ColorGameV2/>} />
        <Route path="/AdvGameProgramming" element={<AdvGameProgramming/>} />
        <Route path="/chatroom" element={<ChatRoom/>} />
      </Routes>
      <Analytics />
    </Router>
  );
}

export default App;
