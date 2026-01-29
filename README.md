# EduSphere Tracking System - Running the Project

Follow these steps to get the project running on your local machine.

## Prerequisites
- Python 3.x
- Node.js & npm
- MySQL Server (running with the database `edusphere_db` and user `edusphere_admin`)

---

## Quick Start (Recommended)

### Option 1: Use the Startup Script (Easiest!)
Simply run this **ONE command** in PowerShell:
```powershell
cd c:\edusphereproject
.\start.ps1
```

This will automatically start both backend and frontend servers in separate windows.

---

## Manual Start (Alternative)

If you prefer to start servers manually, follow these steps:

### 1. Backend Setup (Django)
Open **Terminal 1** and run:
```powershell
cd c:\edusphereproject\backend
.\venv\Scripts\activate
python manage.py runserver
```
*The backend will be available at http://localhost:8000*

### 2. Frontend Setup (React)
Open **Terminal 2** and run:
```powershell
cd c:\edusphereproject\frontend
npm run dev
```
*The frontend will be available at http://localhost:5173*

---

## Important Notes

⚠️ **Both servers must be running for the application to work!**
- Backend handles authentication, database operations, and API endpoints
- Frontend provides the user interface
- They communicate with each other, so both are required

---

## Testing Login
Use the following credentials to log in:
- **Username**: `admin`
- **Password**: `admin123`

Or use any registered user credentials (e.g., `alice12@gmail.com`)

---

## Troubleshooting

### "Server is not responding" error
- Make sure **both** backend and frontend servers are running
- Check that backend is running on port 8000
- Check that frontend is running on port 5173

### Login fails after restart
- This happens when the backend server is not running
- Always start both servers using the commands above
