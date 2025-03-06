
# Face Recognition Attendance System (Python)

This project is a facial recognition attendance system built using Flask, OpenCV, and face_recognition library for Python.

## Features

- Face detection and recognition
- Student registration with photo capture
- Automatic attendance marking
- Admin dashboard with attendance analytics
- Student approval system
- Data export functionality

## Requirements

- Python 3.7+
- OpenCV
- Flask
- face_recognition library
- Other dependencies listed in requirements.txt

## Installation and Setup

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Run the application:
   ```
   python app.py
   ```

## Usage

1. Access the web application at http://localhost:5000
2. Register new faces through the registration page
3. Admin can log in and approve registered students
4. Students can mark attendance through the mark attendance page
5. View and export attendance records through the admin dashboard

## Admin Access

Default admin credentials:
- Username: admin
- Password: admin123

## Developed by

- Shahid Inamdar
- Saloni Upaskar

## License

This project is licensed under the MIT License.
