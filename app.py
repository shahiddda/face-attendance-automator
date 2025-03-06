
from flask import Flask, render_template, Response, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime
import cv2
import numpy as np
import os
import face_recognition
import pickle
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'face-attendance-key-secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Person(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    face_encoding = db.Column(db.PickleType, nullable=True)
    image = db.Column(db.String(255), nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    attendance = db.relationship('Attendance', backref='person', lazy=True)

class Attendance(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    person_id = db.Column(db.String(36), db.ForeignKey('person.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='present')

# Create database tables
with app.app_context():
    db.create_all()

# Login manager
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.password == password:  # In production, use proper password hashing
            login_user(user)
            flash('Login successful!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid credentials', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/admin-dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('index'))
    
    people = Person.query.all()
    attendances = Attendance.query.order_by(Attendance.timestamp.desc()).all()
    
    return render_template('admin_dashboard.html', people=people, attendances=attendances)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        role = request.form.get('role')
        
        if 'image' not in request.files:
            flash('No image uploaded', 'error')
            return redirect(request.url)
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            flash('No image selected', 'error')
            return redirect(request.url)
        
        # Save the image
        image_path = os.path.join('static', 'uploads', f"{uuid.uuid4()}.jpg")
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        image_file.save(image_path)
        
        # Generate face encoding
        image = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            flash('No face detected in the image', 'error')
            os.remove(image_path)
            return redirect(request.url)
        
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Create new person
        new_person = Person(
            id=str(uuid.uuid4()),
            name=name,
            role=role,
            face_encoding=pickle.dumps(face_encoding),
            image=image_path,
            is_approved=False
        )
        
        db.session.add(new_person)
        db.session.commit()
        
        flash('Registration successful! Waiting for admin approval.', 'success')
        return redirect(url_for('index'))
    
    return render_template('register.html')

@app.route('/approve-student/<person_id>', methods=['POST'])
@login_required
def approve_student(person_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    person = Person.query.get(person_id)
    if not person:
        return jsonify({'success': False, 'message': 'Person not found'}), 404
    
    person.is_approved = True
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'{person.name} has been approved'})

# Video feed and face recognition
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
recognition_cooldown = {}

def generate_frames():
    camera = cv2.VideoCapture(0)
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        # Approved persons with face encodings
        approved_persons = Person.query.filter_by(is_approved=True).all()
        approved_encodings = []
        approved_ids = []
        
        for person in approved_persons:
            if person.face_encoding:
                approved_encodings.append(pickle.loads(person.face_encoding))
                approved_ids.append(person.id)
        
        # Process each detected face
        for (x, y, w, h) in faces:
            # Draw rectangle around face
            cv2.rectangle(frame, (x, y), (x+w, y+h), (138, 92, 246), 2)  # Purple color
            
            # Draw corner brackets
            corner_size = min(w, h) // 5
            
            # Top-left corner
            cv2.line(frame, (x, y+corner_size), (x, y), (138, 92, 246), 2)
            cv2.line(frame, (x, y), (x+corner_size, y), (138, 92, 246), 2)
            
            # Top-right corner
            cv2.line(frame, (x+w-corner_size, y), (x+w, y), (138, 92, 246), 2)
            cv2.line(frame, (x+w, y), (x+w, y+corner_size), (138, 92, 246), 2)
            
            # Bottom-left corner
            cv2.line(frame, (x, y+h-corner_size), (x, y+h), (138, 92, 246), 2)
            cv2.line(frame, (x, y+h), (x+corner_size, y+h), (138, 92, 246), 2)
            
            # Bottom-right corner
            cv2.line(frame, (x+w-corner_size, y+h), (x+w, y+h), (138, 92, 246), 2)
            cv2.line(frame, (x+w, y+h), (x+w, y+h-corner_size), (138, 92, 246), 2)
            
            # Process for face recognition
            face_image = frame[y:y+h, x:x+w]
            rgb_face = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Get face encoding
            face_locations = face_recognition.face_locations(rgb_face)
            if face_locations:
                face_encoding = face_recognition.face_encodings(rgb_face, face_locations)[0]
                
                # Compare with approved encodings
                if approved_encodings:
                    matches = face_recognition.compare_faces(approved_encodings, face_encoding)
                    if True in matches:
                        match_index = matches.index(True)
                        person_id = approved_ids[match_index]
                        
                        # Check cooldown for attendance marking
                        now = datetime.now().timestamp()
                        if person_id not in recognition_cooldown or now - recognition_cooldown[person_id] > 10:
                            person = Person.query.get(person_id)
                            
                            # Mark attendance
                            new_attendance = Attendance(
                                id=str(uuid.uuid4()),
                                person_id=person_id,
                                timestamp=datetime.now(),
                                status='present'
                            )
                            db.session.add(new_attendance)
                            db.session.commit()
                            
                            # Update cooldown
                            recognition_cooldown[person_id] = now
                            
                            # Add name on the frame
                            cv2.putText(frame, person.name, (x, y-10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (138, 92, 246), 2)
        
        # Encode frame for streaming
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/mark-attendance')
def mark_attendance():
    return render_template('mark_attendance.html')

@app.route('/get-attendance-records')
@login_required
def get_attendance_records():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    records = []
    attendances = Attendance.query.order_by(Attendance.timestamp.desc()).all()
    
    for attendance in attendances:
        person = Person.query.get(attendance.person_id)
        records.append({
            'id': attendance.id,
            'personId': attendance.person_id,
            'personName': person.name if person else 'Unknown',
            'timestamp': attendance.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'status': attendance.status
        })
    
    return jsonify(records)

@app.route('/export-attendance')
@login_required
def export_attendance():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    # This would generate an Excel/CSV file in a real application
    return jsonify({'success': True, 'message': 'Export functionality would be implemented here'})

# Initialize admin user if not exists
with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            id=str(uuid.uuid4()),
            username='admin',
            password='admin123',  # In production, use proper password hashing
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print('Admin user created: admin/admin123')

if __name__ == '__main__':
    app.run(debug=True)
