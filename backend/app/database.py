import hashlib
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "antigravity")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db["users"]
providers_collection = db["providers"]

def init_db():
    try:
        users_collection.create_index("email", unique=True)
        users_collection.create_index("phone", unique=True)
        print("✓ MongoDB initialized with users collection")
    except Exception as e:
        print(f"✗ MongoDB initialization error: {e}")


def get_all_providers():
    try:
        return list(providers_collection.find({}, {"_id": 0}))
    except Exception as e:
        print(f"✗ MongoDB providers read error: {e}")
        return []


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_user(name: str, email: str, phone: str, password_raw: str):
    try:
        hashed = hash_password(password_raw)
        user_doc = {
            "name": name,
            "email": email,
            "phone": phone,
            "password": hashed
        }
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "phone": phone
            }
        }
    except DuplicateKeyError as e:
        err_str = str(e).lower()
        if "email" in err_str:
            return {"success": False, "error": "An account with this email already exists."}
        if "phone" in err_str:
            return {"success": False, "error": "An account with this phone number already exists."}
        return {"success": False, "error": "Registration failed: User already exists."}
    except Exception as e:
        return {"success": False, "error": str(e)}

def authenticate_user(identifier: str, password_raw: str):
    try:
        hashed = hash_password(password_raw)
        user = users_collection.find_one({
            "$or": [
                {"phone": identifier},
                {"email": identifier}
            ],
            "password": hashed
        })

        if user:
            return {
                "success": True,
                "user": {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "email": user["email"],
                    "phone": user["phone"]
                }
            }
        return {"success": False, "error": "Invalid phone/email or password."}
    except Exception as e:
        return {"success": False, "error": str(e)}

init_db()
