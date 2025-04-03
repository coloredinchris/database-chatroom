import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ColorGameV2.css';

export default function ColorGameV2(){
    const randomColor = () => {
        const red = Math.floor(Math.random() * 256);
        const green = Math.floor(Math.random() * 256);
        const blue = Math.floor(Math.random() * 256);
        return `rgb(${red}, ${green}, ${blue})`;
    }
    
    const getTrianglePattern = (difficulty) => {
        const rows = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
        let pattern = [];
        for (let row = 0; row < rows; row++) {
          const count = 1 + 2 * row;
          pattern.push(new Array(count).fill(null));
        }
        return pattern;
    };
    
    const handleBoxClick = (color) => {
        if (color === answer) {
            setCongratsMessage('Congrats you got it right!!');
            setColors(colors.map(() => answer));
        }
        else {
            setColors(colors.map((c) => (c===color ? '#000000' : c)));
        }
    };

    const handleNewGame = () => {
        setDifficulty(prev => prev);
    }

    const generateNewGame = () => {
        const pattern = getTrianglePattern(difficulty);
        const totalTriangles = pattern.reduce((sum, row) => sum + row.length, 0);
        const newColors = Array.from({ length: totalTriangles }, () => randomColor());
        const correctAnswer = newColors[Math.floor(Math.random() * totalTriangles)];

        setColors(newColors);
        setAnswer(correctAnswer);
        setCongratsMessage(DEFAULT_MESSAGE);
    }

    const [difficulty, setDifficulty] = useState('easy');
    const [colors, setColors] = useState([]);
    const [answer, setAnswer] = useState('');
    const DEFAULT_MESSAGE = 'Which Color is This?';
    const [congratsMessage, setCongratsMessage] = useState(DEFAULT_MESSAGE);
    
    useEffect(() => {
        generateNewGame();
    }, [difficulty]);

    const pattern = getTrianglePattern(difficulty);
    let colorIndex = 0;

    return (
        <section className="colorGameV2">
            <div className="titleContainer">
                <h1>Color Game V2</h1>
                <h2>{congratsMessage}</h2>
                <h2>{answer.toUpperCase()}</h2>
            </div>

            <div className="difficultySelector">
                <label>Difficulty: </label>
                <select onChange={(e) => setDifficulty(e.target.value)} value={difficulty}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            <div className="triangleContainer">
                {pattern.map((row, rowIndex ) => (
                    <div key={rowIndex} className="triangleRow">
                        {row.map((_, colIndex) => {
                            const color = colors[colorIndex];
                            const isFlipped = colIndex % 2 !==0;
                            const box = (
                                <div key={colIndex} className={`triangle ${isFlipped ? 'flipped' : ''}`} style={{borderBottomColor: color}} onClick={() => handleBoxClick(color)}/>
                            );
                            colorIndex++;
                            return box;
                        })}
                    </div>
                ))}
            </div>

            <button onClick={generateNewGame}>New Game</button>
            <Link to="/">Back to Home</Link>
        </section>
    );
      
}