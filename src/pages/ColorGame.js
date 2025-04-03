import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/colorGame.css';

export default function ColorGame() {
  const [boxCount, setBoxCount] = useState(3);
  const [colors, setColors] = useState([]);
  const [answer, setAnswer] = useState('');
  const DEFAULT_MESSAGE = 'Which Color is This?';
  const [congratsMessage, setCongratsMessage] = useState(DEFAULT_MESSAGE);
  
  

  useEffect(() => {
    generateColors(boxCount);
  }, [boxCount]);

  const randomColor = () => {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const generateColors = (count) => {
    const newColors = Array.from({ length: count }, () => randomColor());
    setColors(newColors);
    const correctAnswer = newColors[Math.floor(Math.random() * count)];
    setAnswer(correctAnswer);
    setCongratsMessage(DEFAULT_MESSAGE);
  };

  const handleBoxClick = (color) => {
    if (color === answer) {
      setCongratsMessage('CONGRATS YOU GOT IT RIGHT!!!');
      setColors(new Array(colors.length).fill(answer));
    } else {
      setColors(colors.map((c) => (c === color ? '#000000' : c)));
    }
  };

  return (
    <section className="colorGame" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', backgroundColor: '#000', overflowY: 'auto' }}>
      <div className="titleContainer" style={{ backgroundColor: '#08A045', color: 'white', padding: '20px', width: '100%', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ color: '#fff' }}>Color Game</h1>
        <h2>{congratsMessage}</h2>
        <h2>{answer.toUpperCase()}</h2>
      </div>

      <div style={{ color: 'white', margin: '20px' }}>
        <label htmlFor="boxSlider" style={{ color: 'white' }}>Difficulty: </label>
        <input
          type="range"
          id="boxSlider"
          min="2"
          max="7"
          defaultValue={boxCount}
          onChange={(e) => setBoxCount(Number(e.target.value))}
        />
        <span style={{ color: 'white' }}>{boxCount}</span>
      </div>

      <div id="colorContainer" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '100%',
        padding: '20px'
      }}>
        {colors.map((color, index) => (
          <div
            key={index}
            className="colorbox"
            style={{
              backgroundColor: color,
              width: '150px',
              height: '150px',
              margin: '10px',
              borderRadius: '10px'
            }}
            onClick={() => handleBoxClick(color)}
          ></div>
        ))}
      </div>

      <div className="fncContainer" style={{ marginTop: '20px' }}>
        <button onClick={() => generateColors(boxCount)}>New Game</button>
      </div>

      <Link to="/" style={{ marginTop: '20px', color: '#fff', fontSize: '1.5rem', textDecoration: 'none' }}>← Back to Home</Link>
    </section>
  );
}
