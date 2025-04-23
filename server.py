# This file contains the server-side code for the chat application.
# It uses Flask and Flask-SocketIO to create a simple chat server that allows users to send and receive messages in real-time.
from flask import Flask, render_template, session, request, send_from_directory, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from better_profanity import profanity
from flask_sqlalchemy import SQLAlchemy
import uuid, random, string, os, mimetypes
from datetime import datetime
from time import time
from collections import deque, defaultdict
import bcrypt

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
app.config['MAX_CONTENT_LENGTH'] = 5000 * 1024 * 1024  # 5000MB max upload

# Rate limiter
limiter = Limiter(app=app, key_func=get_remote_address, default_limits=[])

# Uploading files/file types
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Creates folder if not already there
ALLOWED_EXTENSIONS = {
    # Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'ico',
    # Videos
    'mp4', 'webm', 'ogg', 'ogv', 'mov', 'avi', 'mkv',
    # Audio
    'mp3', 'wav', 'oga', 'ogg', 'flac', 'm4a', 'aac',
    # Documents
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'md', 'epub', 'odt',
    # Archives
    'zip', 'rar', '7z', 'tar', 'gz',
    # Code / Developer Files
    'html', 'css', 'js', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'h'
}

# SQLAlchemy configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:MySQLPasswordIsDaBomb!@localhost:3306/chat_db'  # Replace with your credentials
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable overhead tracking

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Example models
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    last_login = db.Column(db.TIMESTAMP, onupdate=db.func.current_timestamp())

class Message(db.Model):
    __tablename__ = 'Messages'
    message_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    edited_at = db.Column(db.TIMESTAMP, nullable=True)

    user = db.relationship('User', backref='messages')

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
    username = request.form.get('username', 'Unknown')
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filename = f"{uuid.uuid4()}_{file.filename}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Construct file URL
            file_url = f"{request.host_url}download/{filename}"
            timestamp = datetime.now().strftime("%I:%M:%S %p")  # 12-hour AM/PM format
            user_color = user_colors.get(username, "#888")  # Get the user's color

            print(f"[UPLOAD] {username} uploaded: {file.filename} from IP: {request.remote_addr}")

            # Create the media message
            media_message = {
                'username': username,
                'message': f"Shared a file: {file.filename}",
                'file_url': file_url,
                'timestamp': timestamp,
                'color': user_color  # Include the user's color
            }

            # Add the media message to chat history
            chat_history.append(media_message)

            # Broadcast the media message to all clients
            socketio.emit('message', media_message)

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
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"[ERROR] Failed to serve file: {e}")
        return jsonify({"error": "File not found"}), 404

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    # Check if the username or email already exists
    existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        return jsonify({"error": "Username or email already exists"}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create a new user
    new_user = User(username=username, email=email, password_hash=hashed_password.decode('utf-8'))
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find the user by email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    # Verify the password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid email or password"}), 401

    # Save the user in the session
    session['user_id'] = user.user_id
    session['username'] = user.username

    return jsonify({"message": "Login successful", "username": user.username}), 200

@app.route('/logout', methods=['POST'])
def logout():
    username = session.get('username')

    if username:
        # Remove the user from the online list
        if username in user_colors:
            readable_colors.append(user_colors[username])  # Re-add the color to the pool
            user_colors.pop(username, None)  # Remove the user from the color map

        # Remove the username from sid_username_dict
        sid_to_remove = None
        for sid, user in sid_username_dict.items():
            if user == username:
                sid_to_remove = sid
                break
        if sid_to_remove:
            sid_username_dict.pop(sid_to_remove)

        # Update the user list for all clients
        user_list = [{"username": u, "color": c} for u, c in user_colors.items()]
        socketio.emit('update_user_list', user_list)

    # Clear the session
    session.clear()

    return jsonify({"message": "Logged out successfully"}), 200

user_colors = {}

sid_username_dict = {}

active_users = {}

chat_history = deque(maxlen=20)

readable_colors = [
    "#00D0E0", "#00D0F0", "#00E000", "#00E060", "#CBCC32",
    "#99D65B", "#26D8D8", "#DBC1BC", "#EFD175", "#D6D65B"
]
random.shuffle(readable_colors)  # Shuffle the colors to randomize the order

@socketio.on('connect')
def handle_connect():
    print(f"[CONNECTED] SID: {request.sid}, IP: {request.remote_addr}") # log connect

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    username = sid_username_dict.pop(sid, None)  # Remove the SID from the dictionary

    if username:
        # Broadcast message from server when a user disconnects
        disconnect_message = {
            'username': 'System',
            'message': f"{username} has left the chat.",
            'user': username,  # Include the username separately
            'color': user_colors.get(username, "#888"),  # Include the user's base color
            'timestamp': datetime.now().strftime("%I:%M:%S %p")
        }
        chat_history.append(disconnect_message)  # Add to chat history
        socketio.emit('message', disconnect_message)  # Broadcast the message

        # Return the user's color to the pool
        if username in user_colors:
            readable_colors.append(user_colors[username])  # Re-add the color to the pool
            user_colors.pop(username, None)  # Remove the user from the color map
            random.shuffle(readable_colors)  # Shuffle the colors to maintain randomness

        # Update the user list for all clients
        user_list = [{"username": u, "color": c} for u, c in user_colors.items()]
        socketio.emit('update_user_list', user_list)

@socketio.on('request_username')
def handle_custom_username(data):
    custom = data.get('custom', '').strip()
    username = custom if custom else gen_username()
    session['username'] = username

    # Assign a unique color for the user
    if username not in user_colors:
        if len(readable_colors) > 0:
            color = readable_colors.pop(0)  # Assign the first available color
        else:
            # Recycle colors if all are used
            color = random.choice(list(user_colors.values()))
        user_colors[username] = color

    print(f"User joined with username: {username}")

    sid_username_dict[request.sid] = username

    user_list = [{"username": u, "color": c} for u, c in user_colors.items()]

    socketio.emit('update_user_list', user_list)

    socketio.emit('set_username', {
        'username': username,
        'color': user_colors[username]
    }, room=request.sid)
    
    # Filter out system messages from the chat history
    filtered_history = [msg for msg in chat_history if msg['username'] != "System"]
    socketio.emit('chat_history', filtered_history, room=request.sid)  # Send filtered chat history

    # Broadcast message from server when a user connects
    join_message = {
        'username': 'System',
        'message': f"{username} has joined the chat.",
        'user': username,  # Include the username separately
        'color': user_colors[username],  # Include the user's base color
        'timestamp': datetime.now().strftime("%I:%M:%S %p")
    }
    chat_history.append(join_message)
    socketio.emit('message', join_message)

message_timestamps = defaultdict(list)
RATE_LIMIT = 3 # Amount per time window
TIME_WINDOW = 60 # Seconds

@socketio.on('message')
def handle_message(data):
    try:
        user_key = session.get("username") or request.sid or request.remote_addr
        now = time()
        
        message_timestamps[user_key] = [
            ts for ts in message_timestamps[user_key] if now - ts < TIME_WINDOW
        ]

        if len(message_timestamps[user_key]) >= RATE_LIMIT:
            oldest = min(message_timestamps[user_key])
            time_remaining = int(TIME_WINDOW - (now - oldest))
            socketio.emit('rate_limited', { "time_remaining" : time_remaining }, room=request.sid)
            return

        message_timestamps[user_key].append(now)

        if isinstance(data, dict) and 'message' in data:
            username = session.get('username', 'Anonymous')
            message = data['message']
            color = user_colors.get(username, "#888")  # Get the user's color

            print(f"[MESSAGE] {username}: {message}")
            
            # Profanity filter
            clean_message = profanity.censor(data['message'])

            # Extract mentions from the message
            mentions = [word[1:] for word in message.split() if word.startswith("@")]

            # Broadcast the message to all clients
            message_data = {
                'username': username, 
                'message': clean_message, 
                'color': color,  # Include the user's color
                'timestamp': datetime.now().strftime("%I:%M:%S %p"),  # 12-hour AM/PM format
                'validUsernames': mentions  # Include mentions
            }
            chat_history.append(message_data)  # Save the message with the color
            socketio.emit('message', message_data)
        else:
            print("Error: Received data is not a valid object or missing 'message' field.")
    except Exception as e:
        print(f"Error handling message: {e}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Creates tables based on the models
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)