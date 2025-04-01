This is a MongoDB-based application for managing laboratory reservations.

Setup Instructions
1. Upload Pre-Made Data
- JSON files are located in backend/models.

2. Run the Backend
In the ccapdev-lab-reservation-system directory, open a command line and run:
cd backend
npm install
npm start

Run the Frontend
In the same directory, open another terminal and run:
cd frontend
npm install
npm start

This will open localhost:3000 in your browser and direct you to the login page.

Login Credentials
Student Account
Email: nicole.martin@dlsu.edu.ph
Password: password123
(Contains 2 pre-made reservations)

Technician Account
Email: kayla.dominguez@dlsu.edu.ph
Password: password123

Libraries Used
Frontend: react
Backend: multer, uuid, bcrypt

Features
✅ Fully Functional
✔ Login
✔ View Profile
✔ View Created Reservations
✔ Make a Reservation
✔ Search Users
✔ Edit Reservation Details
✔ Edit Profile
✔ Delete Reservation
✔ Delete Profile

⚠ Partially Implemented
🔹 Register (password hashing not yet implemented)
