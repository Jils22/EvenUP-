# 📊 EvenUP - Expense Sharing Application

A full-stack expense-sharing web application inspired by Splitwise. EvenUP helps groups of people track shared expenses, automatically calculate balances, and manage settlements with an intuitive interface.

## ✨ Features

- **Group Management** - Create groups and invite members via email
- **Expense Tracking** - Log shared expenses with flexible split options (equal, exact, or percentage)
- **Smart Debt Calculation** - Automatically computes net balances using a greedy settlement algorithm
- **Real-time Activity Feed** - Track all group transactions and changes
- **Smart Settlements** - Settle up payments with optimized debt minimization
- **CSV Export** - Export expense reports for record-keeping
- **Category Management** - Categorize expenses with visual icons
- **Push Notifications** - Get notified of important group events
- **Voice Input** - Add expenses using speech recognition (Chrome/Edge)
- **Dark Mode** - Beautiful dark-themed interface
- **Mobile Responsive** - Works seamlessly on all devices

## 🏗️ Project Structure

```
EvenUP/
├── backend/               # FastAPI backend server
│   ├── app/
│   │   ├── core/         # Configuration and security
│   │   ├── db/           # MongoDB connection
│   │   ├── routes/       # API endpoints
│   │   ├── schemas/      # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── tests/            # Unit tests
│   └── requirements.txt   # Python dependencies
│
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── api/          # API client functions
│   │   ├── components/   # React components
│   │   ├── context/      # Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   ├── public/           # Static assets
│   └── package.json      # Node dependencies
│
└── README.md             # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **PyMongo** - MongoDB driver
- **Pydantic** - Data validation
- **Python-Jose** - JWT authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - SVG icons
- **Recharts** - Data visualization

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ (for frontend)
- **Python** 3.10+ (for backend)
- **MongoDB** 5.0+ (local or Atlas)
- **npm** or **yarn** (Node package manager)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Server will be available at `http://localhost:8000`
   API docs available at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Update .env if backend is on different address
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Application will be available at `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```

## 📝 API Documentation

Once the backend is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `GET /api/groups/{group_id}` - Get group details
- `POST /api/groups/{group_id}/members` - Add member to group

#### Expenses
- `POST /api/groups/{group_id}/expenses` - Create expense
- `GET /api/groups/{group_id}/expenses` - List group expenses
- `PUT /api/groups/{group_id}/expenses/{expense_id}` - Update expense
- `DELETE /api/groups/{group_id}/expenses/{expense_id}` - Delete expense

#### Settlements
- `POST /api/groups/{group_id}/settlements` - Record payment
- `GET /api/groups/{group_id}/settlements` - List settlements
- `DELETE /api/groups/{group_id}/settlements/{settlement_id}` - Delete settlement

#### Balances
- `GET /api/groups/{group_id}/balances` - Get group balances
- `GET /api/users/me/balances` - Get user's total balances across all groups

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest tests/ -v
```

Run linting:
```bash
cd frontend
npm run lint
```

## 🔒 Security

- **Passwords** are hashed using bcrypt
- **Authentication** uses JWT tokens
- **API endpoints** require valid JWT in Authorization header
- **CORS** is configured for allowed origins
- **Environment variables** store sensitive data (never commit `.env`)

## 🐛 Known Issues & Fixes

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running: `mongod`
   - Check `MONGODB_URI` in backend `.env`

2. **CORS Error**
   - Update `CORS_ORIGINS` in `backend/.env` to match your frontend URL
   - Default: `["http://localhost:5173","http://127.0.0.1:5173"]`

3. **Frontend API 404**
   - Check `VITE_API_BASE_URL` in `frontend/.env`
   - Default: `http://localhost:8000/api`

## 📦 Deployment

### Backend (FastAPI)
Recommended platforms:
- **Render** - `https://render.com`
- **Railway** - `https://railway.app`
- **Heroku** - `https://www.heroku.com` (create `Procfile`)
- **AWS EC2** - Manual deployment

### Frontend (React)
Recommended platforms:
- **Vercel** - `https://vercel.com` (zero-config)
- **Netlify** - `https://netlify.com`
- **GitHub Pages** - `https://pages.github.com`

### Database (MongoDB)
- **MongoDB Atlas** - Cloud-hosted MongoDB: `https://www.mongodb.com/cloud/atlas`

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👥 Team

EvenUP is developed as a full-stack learning project.

## 📞 Support

For issues and questions:
1. Check the [FAQ](#faq) section below
2. Review issue tracker
3. Open a new issue with detailed description

## ❓ FAQ

**Q: Can I deploy this to production?**
A: Yes! Remember to:
- Generate a secure `SECRET_KEY` in backend
- Use environment-specific configs
- Enable HTTPS
- Set up proper error monitoring

**Q: How do I reset the database?**
A: Delete all data safely:
```js
// In MongoDB shell
use Splitwise
db.dropDatabase()
```

**Q: Can I customize the currency?**
A: Yes! Update the currency display in UI and ensure backend calculations match.

**Q: Is there a mobile app?**
A: Currently web-based with responsive design. React Native version possible in future.

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Recurring expense automation
- [ ] Social features (friend wishlist)
- [ ] Multi-currency support
- [ ] Webhook integrations
- [ ] API rate limiting and backup

---

Made with ❤️ using React, FastAPI, and MongoDB
