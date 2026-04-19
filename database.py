from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load .env file explicitly
load_dotenv()

ATLAS_URI = os.getenv("ATLAS_URI")
DB_NAME = os.getenv("DB_NAME")

class MongoDB:
    client = None
    database = None

    @staticmethod
    def connect():
        if MongoDB.client is None:
            # Add error checking
            if not ATLAS_URI:
                raise ValueError("ATLAS_URI environment variable is not set")
            if not DB_NAME:
                raise ValueError("DB_NAME environment variable is not set")
            
            MongoDB.client = MongoClient(ATLAS_URI)
            MongoDB.database = MongoDB.client[DB_NAME]
            print("✅ Connected to MongoDB Atlas")
        return MongoDB.database

    @staticmethod
    def get_db():
        if MongoDB.database is None:
            MongoDB.connect()
        return MongoDB.database

    @staticmethod
    def close():
        if MongoDB.client:
            MongoDB.client.close()
            print("🔌 MongoDB connection closed")