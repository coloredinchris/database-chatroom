var socket = io();
var username = "";
var input = document.getElementById("input");
var messagesDiv = document.getElementById("messages");
var toggleModeButton = document.getElementById("toggleMode");
var autocompleteBox = document.getElementById("autocomplete-box");

// Object to store colors for each username
var userColors = {};

// Function to generate a random color
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to format message text with username colors
function formatMessageText(text) {
    return text.replace(/User-\d{4}/g, function(match) {
        if (userColors[match]) {
            return `<span style="color: ${userColors[match].usernameColor}; font-weight: bold;">${match}</span>`;
        }
        return match;
    });
}

// Fetch word suggestions from API
async function fetchWordSuggestions(prefix) {
    const response = await fetch(`https://api.datamuse.com/words?sp=${prefix}*&max=10`);
    const words = await response.json();
    return words.map(word => word.word); // Extract word strings
}

// Handle input changes for autocomplete
input.addEventListener("input", async function() {
    let inputText = input.value;
    let lastWord = inputText.split(" ").pop(); // Get the last word typed

    if (lastWord.length < 2) {
        autocompleteBox.innerHTML = "";
        return;
    }

    let matches = await fetchWordSuggestions(lastWord);
    autocompleteBox.innerHTML = "";

    if (matches.length > 0) {
        matches.forEach(word => {
            let suggestion = document.createElement("div");
            suggestion.textContent = word;
            suggestion.onclick = function() {
                let words = inputText.split(" ");
                words.pop();
                words.push(word);
                input.value = words.join(" ") + " ";
                autocompleteBox.innerHTML = "";
            };
            autocompleteBox.appendChild(suggestion);
        });
    }
});

// Use arrow keys & Enter to navigate suggestions
input.addEventListener("keydown", function(event) {
    let suggestions = autocompleteBox.children;
    let selectedIndex = Array.from(suggestions).findIndex(s => s.classList.contains("selected"));

    if (event.key === "ArrowDown") {
        if (selectedIndex < suggestions.length - 1) {
            if (selectedIndex >= 0) suggestions[selectedIndex].classList.remove("selected");
            suggestions[selectedIndex + 1].classList.add("selected");
        }
        event.preventDefault();
    } else if (event.key === "ArrowUp") {
        if (selectedIndex > 0) {
            suggestions[selectedIndex].classList.remove("selected");
            suggestions[selectedIndex - 1].classList.add("selected");
        }
        event.preventDefault();
    } else if (event.key === "Enter" && selectedIndex >= 0) {
        suggestions[selectedIndex].click();
        event.preventDefault();
    }
});

// Listen for messages
socket.on('message', function(data) {
    var messageDiv = document.createElement("div");

    // Assign colors if not already assigned
    if (!userColors[data.username]) {
        userColors[data.username] = {
            usernameColor: getRandomColor(),
            messageColor: getRandomColor()
        };
    }

    // Create username span
    var usernameSpan = document.createElement("span");
    usernameSpan.textContent = data.username + ": ";
    usernameSpan.style.color = userColors[data.username].usernameColor;
    usernameSpan.style.fontWeight = "bold";

    // Create message span
    var messageSpan = document.createElement("span");
    messageSpan.innerHTML = formatMessageText(data.message);
    messageSpan.style.color = userColors[data.username].messageColor;

    // Append username and message to messageDiv
    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(messageSpan);

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Send message ensuring username is included
input.addEventListener("keypress", function(event) {
    if (event.key === "Enter" && input.value.trim()) {
        var message = input.value;
        console.log("📤 Sending msg: ", message);

        socket.emit('message', { username: username, message: message });

        input.value = "";
        autocompleteBox.innerHTML = ""; // Clear suggestions
    }
});

socket.on('connect', function(){
    console.log("connected to websocket server");
});

// Receive assigned username from server
socket.on('set_username', function(data){
    username = data.username;
    console.log("Username: ", username);
});

// Toggle dark/light mode
toggleModeButton.addEventListener("click", function() {
    var body = document.body;
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
    } else {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
    }
});
