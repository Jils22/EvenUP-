# 🚀 EvenUP Quick Start Guide

## Prerequisites (MUST HAVE)

Before anything else, you need:

1. **MongoDB** - Download and install
   - Windows: https://www.mongodb.com/try/download/community
   - After install, MongoDB Service should auto-start
   - Verify: Open PowerShell and try `mongosh` command

2. **Python 3.10+** - For backend
   - Verify: `python --version`

3. **Node.js 16+** - For frontend
   - Verify: `node --version` and `npm --version`

---

## ⚡ Quick Start (Windows)

### Option 1: Automated (Easiest)
Just run this ONE command in the project root:
```bash
start.bat
```

This will:
- ✅ Start MongoDB
- ✅ Start Backend on http://127.0.0.1:8000
- ✅ Start Frontend on http://localhost:5173

Then go to http://localhost:5173 and create an account.

---

### Option 2: Manual Setup (If automated doesn't work)

#### Step 1: Start MongoDB
```powershell
# Option A: If MongoDB Service installed
net start MongoDB

# Option B: If not installed as service
mongod
```

Verify it works:
```powershell
mongosh
# You should see: test> 
# Type: exit
```

#### Step 2: Start Backend
```bash
cd backend
venv\Scripts\Activate
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
➜ Local:   http://localhost:5173/
```

---

## ✅ Verify Everything Works

Run this verification script:
```bash
python verify_setup.py
```

You should see all green ✅ checks.

---

## 🧪 Test Login Flow

1. Open http://localhost:5173 in browser
2. Click "Sign Up" 
3. Create account with:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"
5. You should be logged in and see Dashboard

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to localhost:5173"
- **Solution**: Frontend didn't start. Run `cd frontend && npm run dev`

### Problem: Login page keeps loading
- **Cause**: Backend not responding or MongoDB not running
- **Solution**: 
  1. Check if backend is running: `http://127.0.0.1:8000/docs` should load
  2. Check if MongoDB is running: `mongosh` should connect
  3. Browser DevTools (F12) → Network tab → check what requests are failing

### Problem: "Cannot GET /health"
- **Cause**: Backend didn't start
- **Solution**: Run backend with `uvicorn app.main:app --reload` in `backend/` folder

### Problem: "MongoDB connection refused"
- **Cause**: MongoDB not running
- **Solution**: Start MongoDB:
  ```bash
  # Windows
  net start MongoDB
  
  # Or if not installed as service
  mongod
  ```

### Problem: "Port 5173 already in use"
- **Cause**: Another app or old dev server still running
- **Solution**: Kill the process or use port 5174 (frontend will auto-use it)

---

## 🔧 Configuration

### Backend (.env)
File: `backend/.env`
```env
MONGODB_URI=mongodb://localhost:27017      # MongoDB connection
MONGODB_DB=Splitwise                        # Database name
SECRET_KEY=your-secret-key                  # Change this in production
CORS_ORIGINS=[...allowed ports...]          # Frontend ports
```

### Frontend (.env)
File: `frontend/.env`
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api  # Backend URL
```

---

## 📊 API Documentation

Once backend is running, open:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## 🎯 Next Steps

After login works:

1. **Create a Group**
   - Click "Groups" → "Create Group"
   - Invite member by email

2. **Add an Expense**
   - Go to group → "Add Expense"
   - Set amount & split type

3. **Settle Debts**
   - Dashboard shows who owes whom
   - Click "Settle" to record payment

---

## 📞 Still Having Issues?

Check these in order:
1. ✅ Is MongoDB running? (`mongosh` connects)
2. ✅ Is backend responding? (`http://127.0.0.1:8000/docs` loads)
3. ✅ Is frontend running? (`http://localhost:5173` loads)
4. ✅ Browser DevTools (F12) → Console tab for errors
5. ✅ Backend terminal for error messages

If still stuck, run: `python verify_setup.py` to get diagnostic info.
