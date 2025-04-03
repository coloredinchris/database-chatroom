import React, {useState} from "react";
import "../styles/ProjectCarousel.css";
const projects = [
    {
        title: "Curse of Erephos - Unity Game",
        description: "Stealth-action game inspired by Dishonored and Aragami. The game presents moral choices for the player and unfolds in a mystical island setting where light and shadow are deeply entwined the islands history.",
        link: "/AdvGameProgramming",
        active: true,
        image: "images/curseofepheros.png"
    },
    {
        title: "Real-Time Chatroom",
        description: "Real-time anonymous chatroom app with file sharing, built to demonstrate computer networking. Uses React and Flask + Socket.IO.",
        active: true,
        link: "/chatroom",
        image: "images/chatroom1.png"
    },
    {
        title: "Coming soon",
        description: "Coming soon",
        link: "#",
        active: false,
        image: "images/comingsoon1.jpeg"
    }
];

const ProjectCarousel = () => {
    const [current, setCurrent] = useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % projects.length);
    const prev = () => setCurrent((prev) => (prev - 1 + projects.length) % projects.length);

    return (
        <div className="carousel-wrapper">

            <button className="nav-button left" onClick={prev}>‹</button>

            <div className="carousel-track" style={{transform: `translateX(-${current*100}%)`}}>
                {projects.map((project, i) => (
                    <div className="carousel-item" key={i}>
                        <div className="carousel-content" >
                            <a href={project.active ? project.link : "#"} className="image-link">
                                <img 
                                src={project.image}
                                alt={project.title}
                                className="project-image"
                                />
                            </a>
                            
                            <div className="project-details">
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                            </div>
                            
                        </div>
                    </div>
                ))}
            </div>

            <button className="nav-button right" onClick={next}>›</button>
            
        </div>
    );
}

export default ProjectCarousel;