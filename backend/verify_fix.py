import requests

BASE_URL = "http://127.0.0.1:8000/api"
GROUP_ID = "6995404958c966e6409a7fb5"

def test_full_group_load():
    # 1. Login
    login_data = {"username": "jils@test.com", "password": "password"}
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} {r.text}")
        return
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Simulate Group.jsx refreshAll()
    endpoints = [
        f"/groups/{GROUP_ID}",
        f"/groups/{GROUP_ID}/members",
        f"/groups/{GROUP_ID}/expenses",
        f"/groups/{GROUP_ID}/balances",
        f"/groups/{GROUP_ID}/activity",
        f"/groups/{GROUP_ID}/expenses/pending"
    ]

    for ep in endpoints:
        url = f"{BASE_URL}{ep}"
        print(f"Fetching {url}...", end=" ")
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            print(f"OK (items: {len(res.json()) if isinstance(res.json(), list) else 'obj'})")
        else:
            print(f"FAILED: {res.status_code} {res.text}")

if __name__ == "__main__":
    test_full_group_load()
