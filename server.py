# Description: This file contains the server-side code for the chat application.
# It uses Flask and Flask-SocketIO to create a simple chat server that allows users to send and receive messages in real-time.
from flask import Flask, render_template, session, request, send_from_directory, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import uuid, random, string, os

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Needed for session management
CORS(app)
socketio = SocketIO(app)


#uploading files/file types
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True) #creates folder if not already there
ALLOWED_EXTENSIONS = {'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def gen_username():
    return "User-" + ''.join(random.choices(string.digits, k=4))

@app.route('/')
def index():
    favicon_version = str(uuid.uuid4())
    return render_template('index.html', favicon_version=favicon_version)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file=request.files['file']
    username = request.form.get('username', 'Unknown1')
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if allowed_file(file.filename):
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        #send file to chat
        file_url = f"/download/{file.filename}"
        
        socketio.emit('message', {
            'username': username, 
            'message': f"Shared a file: {file.filename}", 
            "file_url": file_url})
        
        return jsonify({
            "message": "File uploaded successfully",
            "file_url": file_url,
            "file_name": file.filename
        })

    return jsonify({"error": "Invalid file type"}), 400


@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)


@socketio.on('connect')
def handle_connect():
    if 'username' not in session:
        session['username'] = gen_username()
    username = session['username']
    print(f"System: {username} has joined the chat.")    
    socketio.emit('set_username', {'username': username})

@socketio.on('message')
def handle_message(data):
    try:
        # Ensure that data is a dictionary and contains the 'message' field
        if isinstance(data, dict) and 'message' in data:
            username = session.get('username', 'Anonymous')
            message = data['message']
            print(f"{username}: {message}")

            # Broadcast the message to all clients
            socketio.emit('message', {'username': username, 'message': message})
        else:
            print("Error: Received data is not a valid object or missing 'message' field.")
    except Exception as e:
        print(f"Error handling message: {e}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)