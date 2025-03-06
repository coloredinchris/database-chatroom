# Python Chatroom Project

This project is a simple chatroom application built using Flask and Flask-SocketIO. It allows multiple users to join a chatroom, send messages, and see messages from other users in real-time. Each user is assigned a random username and messages are color-coded for better readability.

## Features

- Real-time messaging using WebSockets
- Randomly generated usernames for users
- Color-coded usernames and messages
- Persistent username and message colors for each session
- Simple and clean user interface

## Technologies Used

- Python
- Flask
- Flask-SocketIO
- HTML
- CSS
- JavaScript
- [Datamuse API](https://www.datamuse.com/api/)

## Usage

1. Open your web browser and navigate to `http://localhost:5000` to access the chatroom.

2. Begin chatting anonymously in real time by typing into the provided text box.

## Datamuse API

The Datamuse API is used to provide autocomplete suggestions for words as users type in the chat input box. The API offers a wide range of word-related functionalities, including word suggestions, synonyms, antonyms, and more.

## Project Structure
- server.py: The main server-side script that handles user connections and messaging.
- static/style.css: The CSS file for styling the chatroom.
- static/script.js: The JavaScript file for handling client-side interactions.
- templates/index.html: The HTML template for the chatroom interface.
- requirements.txt: The list of required Python packages.
- README.md: This file.

## Acknowledgements
- [Flask](https://flask.palletsprojects.com/en/stable/)
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/)
- [Datamuse API](https://www.datamuse.com/api/)