# Description: This file contains the server-side code for the chat application.
# It uses Flask and Flask-SocketIO to create a simple chat server that allows users to send and receive messages in real-time.
from flask import Flask, render_template, session, request, send_from_directory, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from better_profanity import profanity
import uuid, random, string, os, mimetypes
from datetime import datetime
from collections import deque

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Needed for session management
CORS(app, origins=[
    "https://criticalfailcoding.com",
    "http://localhost:3000"
], supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins=[
    "https://criticalfailcoding.com",
    "http://localhost:3000"
])

# Profanity
profanity.load_censor_words()

# Security config
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 # 5MB max upload

# Rate limiter
limiter = Limiter(get_remote_address, app=app, default_limits=["3 per minute"])

# Uploading files/file types
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Creates folder if not already there
ALLOWED_EXTENSIONS = {'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'}  # Allow image and video file types

def allowed_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    mime_type, _ = mimetypes.guess_type(filename)
    return ext in ALLOWED_EXTENSIONS and mime_type is not None

def gen_username():
    return "User-" + ''.join(random.choices(string.digits, k=4))

@app.route('/')
def index():
    favicon_version = str(uuid.uuid4())
    return render_template('index.html', favicon_version=favicon_version)

@app.route('/upload', methods=['POST'])
@limiter.limit("3 per minute")
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    username = request.form.get('username', 'Unknown1')
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filename = f"{uuid.uuid4()}_{file.filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Send file to chat
            file_url = f"/download/{filename}"
            print(f"[UPLOAD] {username} uploaded: {file.filename} from IP: {request.remote_addr}")
            
            socketio.emit('message', {
                'username': username, 
                'message': f"Shared a file: {file.filename}", 
                "file_url": file_url})
            
            return jsonify({
                "message": "File uploaded successfully",
                "file_url": file_url,
                "file_name": file.filename
            })
    
        except Exception as e:
            print(f"[ERROR] Upload failed: {e}")
            return jsonify({"error": "Upload failed"}), 500

    return jsonify({"error": "Invalid file type"}), 400

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

user_colors = {}

sid_username_dict = {}

active_users = {}

chat_history = deque(maxlen=30)

readable_colors = [
    "#3498db", "#9b59b6", "#1abc9c", "#f39c12",
    "#e67e22", "#e74c3c", "#2ecc71", "#34495e"
]

@socketio.on('connect')
def handle_connect():
    print(f"[CONNECTED] SID: {request.sid}, IP: {request.remote_addr}") # log connect

@socketio.on('disconnect')
def handle_disconnect():
    print(f"[DISCONNECTED] SID: {request.sid}, IP: {request.remote_addr}") # log disconnect
    sid = request.sid
    username = sid_username_dict.pop(sid, None)
    if username and sid:
        
        # Broadcast message from server when a user diconnects
        disconnect_message = {
            'username': 'System',
            'message': f"<span style='color: {user_colors[username]}; font-weight: bold;'>{username}</span> has left the chat.",
            'color': '#444',
            'timestamp' : datetime.now().strftime("%H:%M:%S")
        }
        user_colors.pop(username, None)
        chat_history.append(disconnect_message)
        socketio.emit('message', disconnect_message)

        socketio.emit('update_user_list', [{"username": u, "color": c} for u, c in user_colors.items()])
        
        active_users.discard(username)

        socketio.emit('update_user_list', list(active_users))


@socketio.on('request_username')
def handle_custom_username(data):
    # Assign username, random or user given name
    custom = data.get('custom','').strip()
    username = custom if custom else gen_username()
    session['username'] = username

    # Assign colors for users
    if username not in user_colors:
        color = random.choice(readable_colors)
        user_colors[username] = color

    print(f"User joined with username: {username}")

    sid_username_dict[request.sid] = username

    user_list = [{"username": u, "color": c} for u, c in user_colors.items()]

    socketio.emit('update_user_list', user_list)

    socketio.emit('set_username', {
        'username': username,
        'color': user_colors[username]
        }, room=request.sid)
    
    socketio.emit('chat_history', list(chat_history), room=request.sid)

    # Broadcast message from server when a user connects
    join_message = {
        'username': 'System',
        'message': f"<span style='color: {user_colors[username]}; font-weight: bold;'>{username}</span> has joined the chat.",
        'color': '#444',
        'timestamp' : datetime.now().strftime("%H:%M:%S")
    }
    chat_history.append(join_message)
    socketio.emit('message', join_message)

    
@socketio.on('message')
def handle_message(data):
    try:
        # Ensure that data is a dictionary and contains the 'message' field
        if isinstance(data, dict) and 'message' in data:
            username = session.get('username', 'Anonymous')
            message = data['message']
            color = user_colors.get(username, "888")

            print(f"[MESSAGE] {username}: {message}")
            
            #profanity filter
            clean_message = profanity.censor(data['message'])

            # Broadcast the message to all clients
            message_data = {
                'username': username, 
                'message': clean_message, 
                'color': color,
                'timestamp' : datetime.now().strftime("%H:%M:%S")
            }
            chat_history.append(message_data)
            socketio.emit('message', message_data)   
        else:
            print("Error: Received data is not a valid object or missing 'message' field.")
    except Exception as e:
        print(f"Error handling message: {e}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)