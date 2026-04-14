import requests

BASE_URL = "http://127.0.0.1:8000/api"  # Now includes /api
GROUP_ID = "6995404958c966e6409a7fb5"

def test_pending_endpoint():
    # Login first
    login_data = {
        "username": "jils@test.com",
        "password": "password"
    }
    # Login endpoint is now /api/auth/login
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        return
    
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test pending endpoint
    url = f"{BASE_URL}/groups/{GROUP_ID}/expenses/pending"
    print(f"Testing GET {url}")
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text if r.status_code != 200 else 'SUCCESS'}")

    # Test activity endpoint
    url = f"{BASE_URL}/groups/{GROUP_ID}/activity"
    print(f"Testing GET {url}")
    r = requests.get(url, headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text if r.status_code != 200 else 'SUCCESS'}")

if __name__ == "__main__":
    test_pending_endpoint()
