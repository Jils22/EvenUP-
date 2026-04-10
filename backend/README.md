# EvenUP Backend

FastAPI backend for the EvenUP expense-sharing application.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip / poetry
- MongoDB 5.0+

### Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

4. **Run server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Server runs on `http://localhost:8000`
   API docs: `http://localhost:8000/docs` (Swagger)

## 📁 Project Structure

```
app/
├── core/
│   ├── config.py          # Settings and env variables
│   ├── security.py        # JWT and password handling
│   └── auth.py            # Authentication functions
├── db/
│   ├── mongo.py           # MongoDB connection
│   └── deps.py            # Dependency injection
├── routes/                # API endpoints
│   ├── auth.py            # Authentication endpoints
│   ├── users.py           # User endpoints
│   ├── groups.py          # Group management
│   ├── expenses.py        # Expense management
│   ├── settlements.py     # Payment tracking
│   ├── balances.py        # Balance calculations
│   ├── activity.py        # Activity logs
│   └── ...                # Other feature routes
├── schemas/               # Pydantic models
│   ├── auth.py
│   ├── expenses.py
│   ├── groups.py
│   └── ...
├── services/              # Business logic
│   ├── balance_service.py         # Debt calculations
│   ├── expense_service.py         # Expense logic
│   ├── settlement_service.py      # Settlement logic
│   └── common_service.py          # Shared utilities
├── utils/                 # Helper functions
│   ├── mongo_ids.py       # ID serialization
│   ├── activity_log.py    # Activity tracking
│   ├── audit.py           # Audit logging
│   └── notify.py          # Notifications
├── main.py                # Application entry point
└── __pycache__/           # Python cache (ignored)

tests/
├── conftest.py            # Test configuration
├── test_balance.py        # Balance calculation tests
└── __pycache__/           # Test cache (ignored)

requirements.txt           # Python dependencies
```

## 🛠️ Technologies

- **FastAPI** - Modern async web framework
- **Uvicorn** - ASGI server
- **PyMongo** - MongoDB driver
- **Pydantic** - Data validation
- **Python-Jose** - JWT tokens
- **Bcrypt** - Password hashing
- **Python-Dotenv** - Environment management
- **Pytest** - Testing framework

## 📝 API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Key Features

- **RESTful API** - Standard HTTP methods
- **JWT Authentication** - Secure token-based auth
- **Request Validation** - Pydantic schemas
- **Error Handling** - Consistent error responses
- **Database Indexing** - MongoDB index optimization
- **CORS** - Cross-origin support

## 🔐 Security

### Password Management
```python
from app.core.security import create_password_hash, verify_password

# Hash password on registration
hashed = create_password_hash("user_password")

# Verify on login
verify_password("user_password", hashed)  # True/False
```

### JWT Tokens
```python
from app.core.security import create_access_token, verify_token

# Create token
token = create_access_token({"sub": user_id})

# Verify token
payload = verify_token(token)  # Returns decoded data
```

### Protected Endpoints
```python
from fastapi import Depends
from app.core.security import get_current_user

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {"user": user}
```

## 🧪 Testing

### Run Tests
```bash
pytest tests/ -v
```

### Run Specific Test
```bash
pytest tests/test_balance.py -v
```

### Coverage Report
```bash
pytest tests/ --cov=app
```

### Test Utilities
```python
# Use fixtures from conftest.py
def test_something(client, db):
    response = client.get("/api/health")
    assert response.status_code == 200
```

## 💾 MongoDB

### Connection
```python
from app.db.mongo import get_database

db = get_database()
collection = db["expenses"]
```

### Common Operations
```python
# Insert
db["users"].insert_one({"name": "John", "email": "john@example.com"})

# Find
user = db["users"].find_one({"email": "john@example.com"})

# Update
db["users"].update_one({"_id": id}, {"$set": {"name": "Jane"}})

# Delete
db["users"].delete_one({"_id": id})

# Aggregate
results = db["expenses"].aggregate([
    {"$match": {"group_id": group_id}},
    {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
])
```

### Indexes
Indexes are created automatically on startup in `app/main.py`:
```python
@app.on_event("startup")
def ensure_indexes():
    db["users"].create_index("email", unique=True)
    db["groups"].create_index("member_ids")
    # ... more indexes
```

## 🧮 Balance Calculation

The system uses a greedy algorithm to minimize settlement transfers:

```python
from app.services.balance_service import calculate_minimal_settlements

# Get list of minimal transfers needed
settlements = calculate_minimal_settlements(balances)
# Returns: [{"from": user_a, "to": user_b, "amount": 100}, ...]
```

## 🚀 Deployment

### Environment Variables
Create `.env` for production:
```env
SECRET_KEY=your-production-secret-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
MONGODB_DB=Splitwise
CORS_ORIGINS=["https://yourdomain.com"]
```

### Docker
```dockerfile
FROM python:3.10
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Deployment Platforms

1. **Render**
   - Connect GitHub repo
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Railway**
   - Similar setup to Render
   - Auto-detects Python project

3. **Heroku**
   - Create `Procfile`: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Deploy: `git push heroku main`

## 🐛 Common Issues

### MongoDB Connection Error
```
RuntimeError: Could not connect to MongoDB
```
Solution: Check `MONGODB_URI` in `.env` and ensure MongoDB is running

### CORS Error
```
Access-Control-Allow-Origin header missing
```
Solution: Update `CORS_ORIGINS` in `.env` to match frontend URL

### JWT Token Expired
```
HTTPException: Could not validate credentials
```
Solution: Client needs to refresh token or user must login again

## 📊 Monitoring

### Logging
```python
import logging
logger = logging.getLogger(__name__)

logger.info("User registered")
logger.error("Database connection failed")
```

### Health Check
```bash
curl http://localhost:8000/health
# {"ok": true}
```

## 🤝 Development Guidelines

1. **Code Style**
   - Use snake_case for variables and functions
   - Use PascalCase for classes
   - Follow PEP 8 standards

2. **Type Hints**
   - All functions should have type hints
   - Use Pydantic models for validation

3. **Error Handling**
   - Catch specific exceptions
   - Return meaningful error messages
   - Use appropriate HTTP status codes

4. **Database Operations**
   - Always use indexes for query performance
   - Validate input with Pydantic
   - Clean up resources properly

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Pydantic Docs](https://docs.pydantic.dev)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [PyMongo Reference](https://pymongo.readthedocs.io)
- [Python-Jose Auth](https://python-jose.readthedocs.io)
