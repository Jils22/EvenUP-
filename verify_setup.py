#!/usr/bin/env python3
"""
EvenUP Startup Verification Script
Checks that all services are running and properly configured
"""

import asyncio
import sys
import subprocess
import json
from pathlib import Path

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("✅ MongoDB is running")
        return True
    except Exception as e:
        print(f"❌ MongoDB is NOT running: {e}")
        print("   To fix: Start MongoDB with: 'mongod' or 'net start MongoDB'")
        return False

def check_backend():
    """Check if backend API is responding"""
    try:
        import requests
        response = requests.get('http://127.0.0.1:8000/health', timeout=2)
        if response.status_code == 200:
            print("✅ Backend API is running")
            return True
    except Exception as e:
        print(f"❌ Backend API is NOT responding: {e}")
        print("   To fix: Run 'uvicorn app.main:app --reload' in the backend directory")
        return False

def check_env_files():
    """Check if .env files are properly configured"""
    backend_env = Path('backend/.env')
    
    if not backend_env.exists():
        print("❌ backend/.env not found")
        print("   To fix: Copy backend/.env.example to backend/.env")
        return False
    
    with open(backend_env) as f:
        content = f.read()
        if 'MONGODB_URI' not in content:
            print("❌ backend/.env is missing MONGODB_URI")
            return False
        if 'SECRET_KEY' not in content or 'change-this' in content:
            print("⚠️  WARNING: backend/.env has placeholder SECRET_KEY (OK for dev)")
    
    print("✅ Environment files are configured")
    return True

def test_login_endpoint():
    """Test the login endpoint with a test request"""
    try:
        import requests
        # Test with invalid credentials first (should get 401)
        response = requests.post(
            'http://127.0.0.1:8000/auth/login',
            data={'username': 'test@test.com', 'password': 'wrong'},
            timeout=2
        )
        if response.status_code in [401, 400]:
            print("✅ Authentication endpoint is working")
            return True
        elif response.status_code == 500:
            print(f"❌ Backend error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Could not test auth endpoint: {e}")
        return False

async def main():
    print("\n🚀 EvenUP Startup Verification\n")
    print("=" * 50)
    
    checks = [
        ("Environment Files", check_env_files),
        ("MongoDB", check_mongodb),
        ("Backend API", check_backend),
        ("Authentication Endpoint", test_login_endpoint),
    ]
    
    results = []
    for name, check_fn in checks:
        print(f"\nChecking: {name}...")
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"Error during check: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("\n📊 Results Summary:\n")
    
    all_passed = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    
    if all_passed:
        print("\n✅ All checks passed! Your app should be working.")
        print("\nTo use the app:")
        print("1. Open http://localhost:5173 or http://localhost:5174")
        print("2. Go to /register to create an account")
        print("3. Login with your credentials")
        return 0
    else:
        print("\n❌ Some checks failed. Please fix the issues above.")
        print("\nTroubleshooting:")
        print("- Make sure MongoDB is running")
        print("- Make sure backend is running: uvicorn app.main:app --reload")
        print("- Make sure frontend is running: npm run dev")
        return 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
