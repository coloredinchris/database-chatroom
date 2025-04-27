# This file contains the server-side code for the chat application.
# It uses Flask and Flask-SocketIO to create a simple chat server that allows users to send and receive messages in real-time.
from flask import Flask, render_template, session, request, send_from_directory, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from better_profanity import profanity
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer
import uuid, random, string, os, mimetypes, re
from datetime import datetime
from time import time
from collections import deque, defaultdict
import bcrypt
from functools import wraps

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Needed for session management
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to cookies
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Allow cookies for same-site requests
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True if using HTTPS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:3000"]}})

socketio = SocketIO(app, cors_allowed_origins=[
    "https://criticalfailcoding.com",
    "http://localhost:3000"
], manage_session=True)

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

# Initialize a serializer for generating and validating tokens
serializer = URLSafeTimedSerializer(app.secret_key)

# Example models
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    last_login = db.Column(db.TIMESTAMP, onupdate=db.func.current_timestamp())
    color = db.Column(db.String(7), default="#888")  # Add the color field

class Message(db.Model):
    __tablename__ = 'Messages'
    message_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    edited_at = db.Column(db.TIMESTAMP, nullable=True)

    user = db.relationship('User', backref='messages')

class Moderator(db.Model):
    __tablename__ = 'Moderators'
    mod_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), unique=True, nullable=False)

class BannedUser(db.Model):
    __tablename__ = 'Banned_Users'
    ban_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), unique=True, nullable=False)
    banned_by = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=True)
    ban_reason = db.Column(db.Text, nullable=False)
    ban_date = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

def allowed_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    mime_type, _ = mimetypes.guess_type(filename)
    return ext in ALLOWED_EXTENSIONS and mime_type is not None

def gen_username():
    return "User-" + ''.join(random.choices(string.digits, k=4))

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"[DEBUG] Session data in protected route: {session}")  # Debugging log
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

def is_moderator(user_id):
    return Moderator.query.filter_by(user_id=user_id).first() is not None


def is_valid_email(email):
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(email_regex, email)

def is_strong_password(password):
    # At least 8 characters, one uppercase, one lowercase, one number, one special character
    password_regex = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    return re.match(password_regex, password)

@app.route('/')
def index():
    favicon_version = str(uuid.uuid4())
    return render_template('index.html', favicon_version=favicon_version)

@app.route('/upload', methods=['POST'])
@limiter.limit("3 per minute")
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    username = session.get('username', 'Unknown')
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
@login_required
def download_file(filename):
    try:
        # Ensure the file exists in the upload folder
        return send_from_directory(UPLOAD_FOLDER, filename)
    except Exception as e:
        print(f"[ERROR] Failed to serve file: {e}")
        return jsonify({"error": "File not found"}), 404

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')

    if profanity.contains_profanity(username):
        return jsonify({"error": "Username contains inappropriate language"}), 400

    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not is_strong_password(password):
        return jsonify({"error": "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters"}), 400

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
    identifier = data.get('email')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"error": "Email/Username and password are required"}), 400

    # Find the user by email or username
    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    # Check if banned
    if user and BannedUser.query.filter_by(user_id=user.user_id).first():
        return jsonify({"error": "This account has been banned."}), 403

    if not user:
        return jsonify({"error": "Invalid email/username or password"}), 401

    # Verify the password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"error": "Invalid email/username or password"}), 401

    # Update the last_login field
    user.last_login = datetime.now()
    db.session.commit()

    # Save the user in the session
    session['user_id'] = user.user_id
    session['username'] = user.username

    print(f"[DEBUG] Session set during login: {session}")

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
        emit_user_list()

    # Clear the session
    session.clear()

    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/verify-session', methods=['GET'])
def verify_session():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    is_mod = is_moderator(session['user_id'])
    return jsonify({
        "message": "Session is valid",
        "username": session.get('username'),
        "is_moderator": is_mod
    }), 200


@app.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.json
    new_password = data.get('password')

    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    try:
        # Validate the token and extract the email
        email = serializer.loads(token, salt="password-reset-salt", max_age=3600)  # Token expires in 1 hour
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"error": "Invalid token or user not found"}), 404

        # Update the user's password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password_hash = hashed_password.decode('utf-8')
        db.session.commit()

        return jsonify({"message": "Password reset successfully"}), 200
    except Exception as e:
        print(f"[ERROR] Failed to reset password: {e}")
        return jsonify({"error": "Invalid or expired token"}), 400

@app.route('/generate-reset-token', methods=['POST'])
def generate_reset_token():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found with this email"}), 404

    # Generate a reset token
    reset_token = serializer.dumps(email, salt="password-reset-salt")
    return jsonify({"reset_token": reset_token}), 200

@app.route('/delete-user', methods=['DELETE'])
@login_required
def delete_user():
    username = session.get('username')  # Get the username from the session

    if not username:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Find the user by username
        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        # Clear the session
        session.clear()

        return jsonify({"message": f"User '{username}' deleted successfully"}), 200
    except Exception as e:
        print(f"[ERROR] Failed to delete user: {e}")
        return jsonify({"error": "An error occurred while deleting the user"}), 500

@app.route('/update-color', methods=['POST'])
@login_required
def update_color():
    data = request.json
    color = data.get('color')
    username = session.get('username')

    if not color or color not in readable_colors:
        return jsonify({"error": "Invalid color"}), 400

    try:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.color = color
        db.session.commit()
        return jsonify({"message": "Color updated successfully"}), 200
    except Exception as e:
        print(f"[ERROR] Failed to update color: {e}")
        return jsonify({"error": "An error occurred while updating the color"}), 500
    
@app.route('/edit-message/<int:message_id>', methods=['PUT'])
@login_required
def edit_message(message_id):
    data = request.json
    new_content = data.get('content')

    if not new_content:
        return jsonify({"error": "Message content is required"}), 400

    try:
        # Find the message by ID
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404

        # Ensure the user editing the message is the owner
        if message.user_id != session.get('user_id'):
            return jsonify({"error": "Unauthorized"}), 403

        # Update the message content and edited_at timestamp
        message.content = profanity.censor(new_content)
        message.edited_at = datetime.now()
        db.session.commit()

        # Notify all clients about the updated message
        socketio.emit('message_edited', {
            'message_id': message_id,
            'new_content': message.content,
            'edited_at': message.edited_at.strftime("%I:%M:%S %p")
        })

        return jsonify({"message": "Message updated successfully"}), 200
    except Exception as e:
        print(f"[ERROR] Failed to edit message: {e}")
        return jsonify({"error": "An error occurred while editing the message"}), 500
    
@app.route('/change-username', methods=['POST'])
@login_required
def change_username():
    data = request.json
    new_username = data.get('new_username')

    if not new_username:
        return jsonify({"error": "New username is required"}), 400

    if profanity.contains_profanity(new_username):
        return jsonify({"error": "Username contains inappropriate language"}), 400

    # Check if new username is already taken
    if User.query.filter_by(username=new_username).first():
        return jsonify({"error": "Username already taken"}), 400

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    old_username = user.username
    user.username = new_username
    db.session.commit()

    # Update session and in-memory maps
    session['username'] = new_username

    if old_username in user_colors:
        user_colors[new_username] = user_colors.pop(old_username)

    for sid, name in list(sid_username_dict.items()):
        if name == old_username:
            sid_username_dict[sid] = new_username

    # Broadcast updated user list
    user_list = [{"username": u, "color": c} for u, c in user_colors.items()]
    emit_user_list()

    return jsonify({"message": "Username changed successfully", "new_username": new_username}), 200

@app.route('/ban-user', methods=['POST'])
@login_required
def ban_user():
    data = request.json
    username_to_ban = data.get('username')
    reason = data.get('reason', 'No reason provided.')

    if not username_to_ban:
        return jsonify({"error": "Username is required."}), 400

    user_info = sid_username_dict.get(request.sid)
    if not user_info:
        # disconnected user probably
        return

    user_id = user_info.get('user_id')
    username = user_info.get('username')

    if not is_moderator(user_id):
        return jsonify({"error": "You must be a moderator to ban users."}), 403

    user_to_ban = User.query.filter_by(username=username_to_ban).first()
    if not user_to_ban:
        return jsonify({"error": "User not found."}), 404

    # Prevent banning yourself; allow "coloredinchris" to ban moderators
    session_username = session.get('username')
    if user_to_ban.user_id == user_id:
        return jsonify({"error": "You cannot ban yourself."}), 403
    if is_moderator(user_to_ban.user_id) and session_username != 'coloredinchris':
        return jsonify({"error": "Only coloredinchris can ban moderators."}), 403


    banned_entry = BannedUser.query.filter_by(user_id=user_to_ban.user_id).first()
    if banned_entry:
        return jsonify({"error": "User is already banned."}), 400

    try:
        ban = BannedUser(user_id=user_to_ban.user_id, banned_by=user_id, ban_reason=reason)
        db.session.add(ban)
        db.session.commit()

        print(f"[BAN] {username_to_ban} was banned by {session.get('username')}. Reason: {reason}")

        # 👉 FIRST: Prepare HTTP success response but don't return yet
        response = jsonify({"message": f"User '{username_to_ban}' has been banned successfully."})
        response.status_code = 200

        # 👉 THEN: emit ban_notice and disconnect
        target_sid = None
        for sid, user in sid_username_dict.items():
            if user == username_to_ban:
                target_sid = sid
                break

        if target_sid:
            try:
                socketio.emit('ban_notice', {'reason': reason}, room=target_sid)
                socketio.sleep(0.1)  # give it time to deliver
                socketio.disconnect(target_sid)
            except Exception as e:
                print(f"[WARN] Socket disconnect issue: {e}")

        return response  # 👉 NOW actually return success

    except Exception as e:
        print(f"[ERROR] Ban user failed: {e}")
        return jsonify({"error": "Failed to ban user."}), 500

@app.route('/banned-users', methods=['GET'])
@login_required
def get_banned_users():
    try:
        user_id = session.get('user_id')
        username = session.get('username')

        if not user_id or not username:
            return jsonify({"error": "Unauthorized"}), 401

        if not is_moderator(user_id) and username != 'coloredinchris':
            return jsonify({"error": "Forbidden"}), 403

        banned_users = []
        bans = BannedUser.query.all()

        for ban in bans:
            banned_user = User.query.get(ban.user_id)
            if banned_user:
                banned_users.append({
                    "username": banned_user.username,
                    "reason": ban.ban_reason,  # <-- use ban_reason
                    "banned_at": ban.ban_date.strftime("%Y-%m-%d %H:%M:%S")  # <-- use ban_date
                })

        return jsonify({"banned_users": banned_users}), 200
    except Exception as e:
        print(f"[DEBUG] Error fetching banned users: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/registered-users', methods=['GET'])
@login_required
def get_registered_users():
    users = User.query.all()
    banned_ids = {ban.user_id for ban in BannedUser.query.all()}  # get all banned user IDs
    mods = {mod.user_id for mod in Moderator.query.all()}  # get all moderator IDs

    user_data = [
        {
            "username": user.username,
            "is_moderator": user.user_id in mods
        }
        for user in users
        if user.user_id not in banned_ids  # filter out banned users
    ]

    return jsonify({"users": user_data}), 200

user_colors = {}

sid_username_dict = {}

active_users = {}

connected_users = {}

chat_history = deque(maxlen=20)

readable_colors = [
    "#00D0E0", "#00D0F0", "#00E000", "#00E060", "#CBCC32",
    "#99D65B", "#26D8D8", "#DBC1BC", "#EFD175", "#D6D65B"
]
random.shuffle(readable_colors)  # Shuffle the colors to randomize the order
print(f"[DEBUG] Initial readable_colors: {readable_colors}")

def emit_user_list():
    socketio.emit('update_user_list', build_online_user_list())

def build_online_user_list():
    mods = {mod.user_id for mod in Moderator.query.all()}
    banned_ids = {ban.user_id for ban in BannedUser.query.all()}

    user_list = []
    for sid, username in connected_users.items():
        info = sid_username_dict.get(sid)
        if not info:
            continue  # Skip if no user info

        user_id = info['user_id']
        if user_id not in banned_ids:
            user_list.append({
                "username": username,
                "color": user_colors.get(username, "#888"),
                "is_moderator": user_id in mods
            })

    return user_list

@socketio.on('connect')
def handle_connect(auth):
    print("[DEBUG] CONNECT event received")
    print("[DEBUG] Auth payload:", auth)
    username = auth.get('username')
    if username:
        connected_users[request.sid] = username
        print(f"[DEBUG] Connected user: {username} with SID {request.sid}")
    else:
        print("[DEBUG] No username received at connect")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid

    username_info = sid_username_dict.pop(sid, None)
    connected_users.pop(sid, None)

    if username_info:
        username = username_info['username'] if isinstance(username_info, dict) else username_info

        disconnect_message = {
            'username': 'System',
            'message': f"{username} has left the chat.",
            'user': username,
            'color': user_colors.get(username, "#888"),
            'timestamp': datetime.now().strftime("%I:%M:%S %p")
        }
        chat_history.append(disconnect_message)
        socketio.emit('message', disconnect_message)

        if username in user_colors:
            readable_colors.append(user_colors[username])
            user_colors.pop(username, None)
            random.shuffle(readable_colors)

    emit_user_list()

@socketio.on('request_username')
def handle_custom_username(data):
    custom = data.get('custom', '').strip()
    username = custom if custom else gen_username()
    session['username'] = username

    # Fetch or assign a color for the user
    user = User.query.filter_by(username=username).first()
    if user:
        if user.color == "#888":  # Check if the user has the default color
            if readable_colors:
                user.color = readable_colors.pop(0)  # Assign a new color
                db.session.commit()
                print(f"[DEBUG] Updated color for existing user: {username}, new color: {user.color}")
            else:
                print(f"[DEBUG] No colors left in the pool for user: {username}")
        color = user.color
        print(f"[DEBUG] Found existing user: {username}, using color: {color}")
    else:
        # Assign a random color from the pool for new users
        color = readable_colors.pop(0) if readable_colors else "#888"
        new_user = User(username=username, color=color)
        db.session.add(new_user)
        db.session.commit()
        print(f"[DEBUG] Created new user: {username}, assigned color: {color}")

    user_colors[username] = color
    sid_username_dict[request.sid] = {
        'username': username,
        'user_id': user.user_id if user else None
    }

    # Update the user list for all clients
    user_list = [{"username": u, "color": c} for u, c in user_colors.items()]
    emit_user_list()

    # Send the username and color to the client
    socketio.emit('set_username', {
        'username': username,
        'color': color
    }, room=request.sid)

    # Fetch chat history from the database
    chat_history = Message.query.order_by(Message.timestamp.asc()).all()
    valid_usernames = [u.username for u in User.query.all()]  # Get all valid usernames
    filtered_history = [
        {
            'message_id': msg.message_id,
            'username': msg.user.username,
            'message': msg.content,
            'timestamp': msg.timestamp.strftime("%I:%M:%S %p"),
            'color': msg.user.color or "#888",  # Use stored color
            'edited_at': msg.edited_at.strftime("%I:%M:%S %p") if msg.edited_at else None,  # Include edited_at
            'validUsernames': valid_usernames  # Include valid usernames for mentions
        } for msg in chat_history
    ]
    socketio.emit('chat_history', filtered_history, room=request.sid)

    # Broadcast join message
    join_message = {
        'username': 'System',
        'message': f"{username} has joined the chat.",
        'user': username,
        'color': color,
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
        username = session.get('username', 'Anonymous')
        user = User.query.filter_by(username=username).first()
        color = user.color if user else "#888"  # Use the stored color

        message = data['message']
        clean_message = profanity.censor(message)

        # Save the message to the database
        if user:
            new_message = Message(user_id=user.user_id, content=clean_message)
            db.session.add(new_message)
            db.session.commit()

        # Get the list of all usernames for @mentions
        valid_usernames = [u.username for u in User.query.all()]

        # Broadcast the message
        message_data = {
            'message_id': new_message.message_id,
            'username': username,
            'message': clean_message,
            'color': color,  # Include the user's color
            'timestamp': datetime.now().strftime("%I:%M:%S %p"),
            'edited_at': None,  # New messages are not edited
            'validUsernames': valid_usernames  # Include valid usernames for mentions
        }
        chat_history.append(message_data)
        socketio.emit('message', message_data)
    except Exception as e:
        print(f"Error handling message: {e}")

@socketio.on('edit_message')
def handle_edit_message(data):
    try:
        user_info = sid_username_dict.get(request.sid)
        if not user_info:
            # disconnected user probably
            return

        user_id = user_info.get('user_id')
        username = user_info.get('username')

        if not user_id:
            return  # User must be logged in

        message_id = data.get('message_id')
        new_content = data.get('content')

        if not message_id or not new_content:
            return  # Invalid data

        # Find the message in the database
        message = Message.query.get(message_id)
        if not message:
            return  # Message not found

        # Check ownership
        if message.user_id != user_id:
            return  # Not authorized

        # Update content and edited time
        message.content = profanity.censor(new_content)
        message.edited_at = datetime.now()
        db.session.commit()

        # Notify clients about the edit
        socketio.emit('message_edited', {
            'message_id': message_id,
            'new_content': message.content,
            'edited_at': message.edited_at.strftime("%I:%M:%S %p")
        })

    except Exception as e:
        print(f"[ERROR] Failed to handle edit_message: {e}")

@socketio.on('ban_user_command')
def handle_ban_user_command(data):
    try:
        user_info = sid_username_dict.get(request.sid)
        if not user_info:
            # disconnected user probably
            return

        user_id = user_info.get('user_id')
        username = user_info.get('username')

        if not user_id:
            socketio.emit('ban_response', {'success': False, 'error': "Unauthorized"}, room=request.sid)
            return

        username = data.get('username')
        reason = data.get('reason', "No reason provided.")
        if not username:
            socketio.emit('ban_response', {'success': False, 'error': "Username is required."}, room=request.sid)
            return

        mod = Moderator.query.filter_by(user_id=user_id).first()
        if not mod:
            socketio.emit('ban_response', {'success': False, 'error': "You must be a moderator to ban users."}, room=request.sid)
            return

        target_user = User.query.filter_by(username=username).first()
        if not target_user:
            socketio.emit('ban_response', {'success': False, 'error': "User not found."}, room=request.sid)
            return

        # Check if already banned
        existing_ban = BannedUser.query.filter_by(user_id=target_user.user_id).first()
        if existing_ban:
            socketio.emit('ban_response', {'success': False, 'error': "User is already banned."}, room=request.sid)
            return

        banned = BannedUser(user_id=target_user.user_id, banned_by=user_id, ban_reason=reason)
        db.session.add(banned)
        db.session.commit()

        # Try disconnecting if online
        target_sid = None
        for sid, user in sid_username_dict.items():
            if user == username:
                target_sid = sid
                break

        if target_sid:
            try:
                socketio.emit('ban_notice', {'reason': reason}, room=target_sid)
                socketio.sleep(0.1)
                socketio.disconnect(target_sid)
            except Exception as e:
                print(f"[WARN] Socket disconnect issue: {e}")

        print(f"[BAN] {username} was banned via /ban command by {session.get('username')}. Reason: {reason}")

        # 👉 NOW send SUCCESS to the moderator
        socketio.emit('ban_response', {'success': True, 'message': f"User '{username}' banned successfully."}, room=request.sid)
        socketio.emit('update_user_list', build_online_user_list())

    except Exception as e:
        print(f"[ERROR] Failed to handle ban_user_command: {e}")
        socketio.emit('ban_response', {'success': False, 'error': "Failed to ban user."}, room=request.sid)

@socketio.on('unban_user_command')
def handle_unban_user_command(data):
    try:
        user_info = sid_username_dict.get(request.sid)
        if not user_info:
            # disconnected user probably
            return

        user_id = user_info.get('user_id')
        username = user_info.get('username')

        if not user_id:
            socketio.emit('unban_response', {'success': False, 'error': "Unauthorized."}, room=request.sid)
            return

        if not is_moderator(user_id):
            socketio.emit('unban_response', {'success': False, 'error': "You must be a moderator."}, room=request.sid)
            return

        username = data.get('username')
        if not username:
            socketio.emit('unban_response', {'success': False, 'error': "Username is required."}, room=request.sid)
            return

        target_user = User.query.filter_by(username=username).first()
        if not target_user:
            socketio.emit('unban_response', {'success': False, 'error': "User not found."}, room=request.sid)
            return

        ban_record = BannedUser.query.filter_by(user_id=target_user.user_id).first()
        if not ban_record:
            socketio.emit('unban_response', {'success': False, 'error': "User is not banned."}, room=request.sid)
            return

        db.session.delete(ban_record)
        db.session.commit()

        print(f"[UNBAN] {username} was unbanned by {session.get('username')}.")

        # Send success
        socketio.emit('unban_response', {'success': True, 'message': f"User '{username}' unbanned successfully."}, room=request.sid)

    except Exception as e:
        print(f"[ERROR] Failed to unban user: {e}")
        socketio.emit('unban_response', {'success': False, 'error': "Server error."}, room=request.sid)

@socketio.on('promote_user_command')
def handle_promote_user(data):
    username = connected_users.get(request.sid)
    if not username:
        emit('error', {'error': 'Unauthorized'}, to=request.sid)
        return

    if username != 'coloredinchris':
        emit('error', {'error': 'Unauthorized'}, to=request.sid)
        return

    target_username = data.get('username')
    target_user = User.query.filter_by(username=target_username).first()

    if target_user:
        if target_user.username == 'coloredinchris':
            emit('error', {'error': 'Cannot promote coloredinchris'}, to=request.sid)
            return
        
        if Moderator.query.filter_by(user_id=target_user.user_id).first():
            emit('error', {'error': 'User is already a moderator'}, to=request.sid)
            return

        new_moderator = Moderator(user_id=target_user.user_id)
        db.session.add(new_moderator)
        db.session.commit()

        socketio.emit('user_role_updated', {'user_id': target_user.user_id, 'new_role': 'moderator'})
        emit('success', {'message': f"{target_username} promoted to moderator."}, to=request.sid)
        emit_user_list()
    else:
        emit('error', {'error': 'User not found'}, to=request.sid)

@socketio.on('demote_user_command')
def handle_demote_user(data):
    username = connected_users.get(request.sid)
    if not username:
        emit('error', {'error': 'Unauthorized'}, to=request.sid)
        return

    if username != 'coloredinchris':
        emit('error', {'error': 'Unauthorized'}, to=request.sid)
        return

    target_username = data.get('username')
    target_user = User.query.filter_by(username=target_username).first()

    if target_user:
        if target_user.username == 'coloredinchris':
            emit('error', {'error': 'Cannot demote coloredinchris'}, to=request.sid)
            return
        
        moderator_entry = Moderator.query.filter_by(user_id=target_user.user_id).first()
        if not moderator_entry:
            emit('error', {'error': 'User is not a moderator'}, to=request.sid)
            return

        db.session.delete(moderator_entry)
        db.session.commit()

        socketio.emit('user_role_updated', {'user_id': target_user.user_id, 'new_role': 'user'})
        emit('success', {'message': f"{target_username} demoted to user."}, to=request.sid)
        emit_user_list()
    else:
        emit('error', {'error': 'User not found'}, to=request.sid)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Creates tables based on the models
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)