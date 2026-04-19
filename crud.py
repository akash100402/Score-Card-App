from database import MongoDB
from models import ScoreCardCreate, ScoreCardUpdate
from schemas import scorecard_helper
from bson import ObjectId

# Get database instance
db = MongoDB.get_db()
scorecards_collection = db.scorecards
users_collection = db.users

# User CRUD
def create_user(user_data: dict):
    existing_user = users_collection.find_one({"username": user_data["username"]})
    if existing_user:
        return None
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)

def get_user_by_username(username: str):
    user = users_collection.find_one({"username": username})
    return user

# ScoreCard CRUD
def get_next_sno(user_id: str):
    last_score = scorecards_collection.find_one(
        {"user_id": user_id},
        sort=[("sno", -1)]
    )
    return (last_score["sno"] + 1) if last_score else 1

def create_scorecard(user_id: str, scorecard: ScoreCardCreate):
    sno = get_next_sno(user_id)
    scorecard_dict = scorecard.dict()
    scorecard_dict["user_id"] = user_id
    scorecard_dict["sno"] = sno
    result = scorecards_collection.insert_one(scorecard_dict)
    return str(result.inserted_id)

def get_user_scorecards(user_id: str):
    scorecards = list(scorecards_collection.find({"user_id": user_id}).sort("sno", 1))
    return [scorecard_helper(score) for score in scorecards]

def update_scorecard(scorecard_id: str, user_id: str, scorecard_data: ScoreCardUpdate):
    update_data = {k: v for k, v in scorecard_data.dict().items() if v is not None}
    if update_data:
        result = scorecards_collection.update_one(
            {"_id": ObjectId(scorecard_id), "user_id": user_id},
            {"$set": update_data}
        )
        return result.modified_count > 0
    return False

def delete_scorecard(scorecard_id: str, user_id: str):
    result = scorecards_collection.delete_one({"_id": ObjectId(scorecard_id), "user_id": user_id})
    return result.deleted_count > 0