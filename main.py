from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import MongoDB
from models import UserRegister, UserLogin, ScoreCardCreate, ScoreCardUpdate
from auth import hash_password, verify_password, create_access_token, get_current_user
from crud import create_user, get_user_by_username, create_scorecard, get_user_scorecards, update_scorecard, delete_scorecard
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Application starting up...")
    try:
        MongoDB.connect()
        print("✅ Connected to MongoDB Atlas")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    print("👋 Application shutting down...")
    MongoDB.close()
    print("🔌 MongoDB connection closed")

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/register")
def register(user: UserRegister):
    existing = get_user_by_username(user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pw = hash_password(user.password)
    user_id = create_user({
        "username": user.username,
        "password": hashed_pw
    })
    
    if not user_id:
        raise HTTPException(status_code=400, detail="Registration failed")
    
    return {"message": "User registered successfully", "user_id": user_id}

@app.post("/api/login")
def login(user: UserLogin):
    db_user = get_user_by_username(user.username)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.username, "user_id": str(db_user["_id"])})
    return {"access_token": token, "token_type": "bearer", "username": user.username, "user_id": str(db_user["_id"])}

@app.post("/api/scorecards")
def add_scorecard(scorecard: ScoreCardCreate, current_user = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    scorecard_id = create_scorecard(user_id, scorecard)
    return {"message": "Scorecard added", "scorecard_id": scorecard_id}

@app.get("/api/scorecards")
def get_scorecards(current_user = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    scorecards = get_user_scorecards(user_id)
    return {"scorecards": scorecards}

@app.put("/api/scorecards/{scorecard_id}")
def update_scorecard_route(scorecard_id: str, scorecard_data: ScoreCardUpdate, current_user = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    updated = update_scorecard(scorecard_id, user_id, scorecard_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return {"message": "Scorecard updated"}

@app.delete("/api/scorecards/{scorecard_id}")
def delete_scorecard_route(scorecard_id: str, current_user = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    deleted = delete_scorecard(scorecard_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scorecard not found")
    return {"message": "Scorecard deleted"}

# Serve Static Files (mount these FIRST)
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")

# Serve HTML Pages
@app.get("/")
async def serve_index():
    return FileResponse("frontend/index.html")

@app.get("/dashboard")
async def serve_dashboard():
    return FileResponse("frontend/dashboard.html")

# Catch-all route - MUST be LAST
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # If it's an API call or static file that doesn't exist, return 404
    if full_path.startswith("api/") or full_path.startswith("css/") or full_path.startswith("js/") or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not found")
    # For any other path, serve index.html (for client-side routing)
    return FileResponse("frontend/index.html")