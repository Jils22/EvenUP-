# 📌 Project: EvenUp (Splitwise Clone)

## 🧭 Overview
EvenUp is a full-stack expense-sharing application inspired by Splitwise. It allows users to:
- Create groups
- Add members
- Track shared expenses
- Automatically calculate balances
- View activity logs

## 🎯 Objectives
- Build a scalable full-stack system
- Implement accurate expense splitting logic
- Deliver a clean, user-friendly interface
- Prepare a production-ready deployment

---

## 🔄 End-to-End Workflow

### 1. Project Initialization
- Define requirements
- Setup repository & folder structure
- Choose tech stack

### 2. Backend Development
- Authentication (JWT)
- Group management APIs
- Expense APIs
- Balance calculation engine
- Activity tracking

### 3. Frontend Development
- UI structure (React)
- API integration
- State management
- User interaction flows

### 4. Integration
- Connect frontend with backend APIs
- Validate data flow

### 5. Testing
- Unit testing (backend logic)
- Integration testing
- Manual UI testing

### 6. Optimization
- Performance improvements
- Error handling
- UI polishing

### 7. Deployment
- Backend hosting
- Frontend hosting
- Database setup (production)

---

## 🧱 Technical Architecture

### 🔹 Frontend
- React.js
- JavaScript (ES6+)
- Axios / Fetch API
- CSS / Tailwind (optional)

### 🔹 Backend
- FastAPI
- Python
- JWT Authentication
- REST APIs

### 🔹 Database
- MongoDB
- PyMongo

### 🔹 DevOps
- Git & GitHub
- Docker (optional)
- Render / Railway / Vercel (deployment)

---

## 🧰 Tools & Dependencies

### Frontend
- React
- React Router
- Axios

### Backend
- FastAPI
- Uvicorn
- python-jose (JWT)
- Pydantic

### Database
- MongoDB
- PyMongo

### Dev Tools
- Git
- Postman (API testing)
- VS Code

### Testing (Planned)
- Pytest
- React Testing Library

---

## ⚙️ Setup Instructions

### Backend
```bash
pip install fastapi uvicorn pymongo python-jose
uvicorn app.main:app --reload

### Frontend
npm install 
npm start


### Environment Variables
JWT_SECRET=your_secret
MONGO_URI=your_db_uri