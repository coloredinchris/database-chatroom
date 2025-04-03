import { Link } from 'react-router-dom';
import React from "react";
import ProjectCarousel from "../components/ProjectCarousel";
import "../styles/Home.css";

export default function Home() {
    return (
        <div className="home-container">
            {/* Banner */}
            <header className="banner">
                <h1>Michael Hamilton</h1>
                <p className="tagline">Developer | Full-Stack | Networking | Game Design</p>
                <div class="social-icons">
                </div>
            </header>
        
            {/* Intro */}
            <section className="intro">
            <p>
                I’m a developer with a focus on full-stack development. 
                Through academic and personal projects, I’ve built real-time chatrooms, color-based logic games, 
                database-driven applications, and even a custom game engine using C++ with SDL and Box2D.
                I'm currently pursuing full-stack development as a professional path, building a strong foundation
                across both front-end and back-end technologies.
            </p>

            </section>
        
            {/* Technologies */}
            <section className="tech-stack">
                <h2>Technologies I've Work With</h2>
                <ul className="tech-list">
                    <li>C++</li>
                    <li>Java</li>
                    <li>JavaScript</li>
                    <li>React</li>
                    <li>Python</li>
                    <li>Flask & Socket.IO</li>
                    <li>SQL</li>
                    <li>PHP</li>
                    <li>phpMyAdmin</li>
                    <li>MAMP</li>
                    <li>Unity (C#)</li>
                    <li>SDL / Box2D</li>
                </ul>
                <h3>Data & AI</h3>
                    <ul className="tech-list">
                        <li>Python (AI/ML)</li>
                        <li>Reinforcement Learning</li>
                        <li>Neural Networks</li>
                    </ul>
            </section>
        
            {/* Projects Placeholder */}
            <section className="projects">
                <h2>My Projects</h2>
                <ProjectCarousel/>
            </section>
        </div>
    );
}