import os
from pymongo import MongoClient
from bson import ObjectId

# Database config
MONGODB_URI = "mongodb://localhost:27017"
MONGODB_DB = "Splitwise"

def check_goa_trip():
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB]
    
    # Check user first
    user = db["users"].find_one({"email": "jils@test.com"})
    if not user:
        print("User jils@test.com not found")
        return

    print(f"User found: {user['_id']} ({user['name']})")
    
    # Check groups
    groups = list(db["groups"].find({"member_ids": user["_id"]}))
    print(f"User is member of {len(groups)} groups:")
    
    goa_group = None
    for g in groups:
        print(f"- {g['name']} (ID: {g['_id']})")
        if "goa" in g['name'].lower():
            goa_group = g
            
    if goa_group:
        print("\nDetails for Goa Group:")
        print(f"ID: {goa_group['_id']}")
        print(f"Members: {goa_group.get('member_ids', [])}")
        # Check if members actually exist
        members = list(db["users"].find({"_id": {"$in": goa_group.get('member_ids', [])}}))
        print(f"Found {len(members)} member documents in users table.")
        for m in members:
            print(f"  - {m.get('name')} ({m.get('email')})")
            
        # Check expenses for this group
        expense_count = db["expenses"].count_documents({"group_id": goa_group["_id"]})
        print(f"Expense count: {expense_count}")
    else:
        print("\nGoa Trip group not found among user's groups.")

    client.close()

if __name__ == "__main__":
    check_goa_trip()
