from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'theadmins-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="The Admins - Cybersecurity Mission System")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class UserRole:
    ADMIN = "admin"
    TENENTE = "tenente"
    ELITE = "elite"
    SOLDADO = "soldado"
    EXTERNO = "externo"

class MissionStatus:
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ReportStatus:
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class MissionCategory:
    GOLPE = "golpe"
    FRAUDE = "fraude"
    PHISHING = "phishing"
    MALWARE = "malware"
    GRUPO_WHATSAPP = "grupo_whatsapp"
    CONTEUDO_ILEGAL = "conteudo_ilegal"
    TROJAN = "trojan"
    SPYWARE = "spyware"
    APK_MALICIOSO = "apk_malicioso"
    OUTROS = "outros"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    role: str = UserRole.EXTERNO

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    missions_completed: int = 0
    reports_submitted: int = 0
    rank_points: int = 0
    created_at: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Mission Models
class MissionCreate(BaseModel):
    title: str
    description: str
    target_url: str
    category: str
    priority: str = "medium"
    evidence: Optional[str] = None

class MissionResponse(BaseModel):
    id: str
    title: str
    description: str
    target_url: str
    category: str
    priority: str
    status: str
    site_status: int = 0
    assigned_to: Optional[str] = None
    assigned_username: Optional[str] = None
    created_by: str
    created_at: str
    completed_at: Optional[str] = None
    evidence: Optional[str] = None

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None

# Report Models
class ReportCreate(BaseModel):
    title: str
    description: str
    target_url: str
    category: str
    evidence: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    description: str
    target_url: str
    category: str
    status: str
    submitted_by: str
    submitted_username: str
    reviewed_by: Optional[str] = None
    created_at: str
    reviewed_at: Optional[str] = None
    evidence: Optional[str] = None

# Tool Models
class ToolCreate(BaseModel):
    name: str
    description: str
    category: str
    url: Optional[str] = None
    is_file: bool = False

class ToolResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    url: Optional[str] = None
    file_path: Optional[str] = None
    is_file: bool
    created_by: str
    created_at: str

# Chat Models
class ChatMessage(BaseModel):
    content: str

class ChatResponse(BaseModel):
    id: str
    user_id: str
    username: str
    role: str = "externo"
    content: str
    is_ai: bool
    created_at: str

# Badge Models
class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    requirement_type: str
    requirement_value: int

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        # Tenente tem mesmo acesso que admin
        effective_roles = allowed_roles.copy()
        if UserRole.ADMIN in effective_roles and UserRole.TENENTE not in effective_roles:
            effective_roles.append(UserRole.TENENTE)
        if user["role"] not in effective_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "username": user_data.username,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "missions_completed": 0,
        "reports_submitted": 0,
        "rank_points": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user_data.role)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "username": user_data.username,
            "role": user_data.role,
            "missions_completed": 0,
            "reports_submitted": 0,
            "rank_points": 0,
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "role": user["role"],
            "missions_completed": user.get("missions_completed", 0),
            "reports_submitted": user.get("reports_submitted", 0),
            "rank_points": user.get("rank_points", 0),
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== USER ROUTES ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.TENENTE]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/ranking", response_model=List[UserResponse])
async def get_ranking(user: dict = Depends(get_current_user)):
    users = await db.users.find(
        {"role": {"$ne": UserRole.EXTERNO}},
        {"_id": 0, "password": 0}
    ).sort("rank_points", -1).to_list(50)
    return [UserResponse(**u) for u in users]

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: UserUpdate, user: dict = Depends(require_roles([UserRole.ADMIN]))):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_dict})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return UserResponse(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ==================== SITE CHECK ====================

async def check_site_status(url: str) -> int:
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            return response.status_code
    except Exception:
        return 0

async def background_site_check():
    while True:
        missions = await db.missions.find(
            {"status": {"$in": [MissionStatus.PENDING, MissionStatus.IN_PROGRESS]}}
        ).to_list(1000)
        
        for mission in missions:
            status_code = await check_site_status(mission["target_url"])
            update_data = {"site_status": status_code}
            
            if status_code == 404 or status_code == 0:
                if mission["status"] == MissionStatus.IN_PROGRESS:
                    update_data["status"] = MissionStatus.COMPLETED
                    update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
                    
                    if mission.get("assigned_to"):
                        await db.users.update_one(
                            {"id": mission["assigned_to"]},
                            {"$inc": {"missions_completed": 1, "rank_points": 100}}
                        )
            
            await db.missions.update_one({"id": mission["id"]}, {"$set": update_data})
        
        await asyncio.sleep(60)

@api_router.post("/site-check")
async def manual_site_check(url: str, user: dict = Depends(get_current_user)):
    status_code = await check_site_status(url)
    return {"url": url, "status_code": status_code, "is_online": status_code == 200}

# ==================== MISSION ROUTES ====================

@api_router.post("/missions", response_model=MissionResponse)
async def create_mission(
    mission_data: MissionCreate,
    user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.TENENTE, UserRole.ELITE]))
):
    site_status = await check_site_status(mission_data.target_url)
    
    mission_id = str(uuid.uuid4())
    mission_doc = {
        "id": mission_id,
        "title": mission_data.title,
        "description": mission_data.description,
        "target_url": mission_data.target_url,
        "category": mission_data.category,
        "priority": mission_data.priority,
        "status": MissionStatus.PENDING,
        "site_status": site_status,
        "assigned_to": None,
        "assigned_username": None,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "evidence": mission_data.evidence
    }
    
    await db.missions.insert_one(mission_doc)
    return MissionResponse(**mission_doc)

@api_router.get("/missions", response_model=List[MissionResponse])
async def get_missions(
    status: Optional[str] = None,
    category: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    if user["role"] == UserRole.EXTERNO:
        raise HTTPException(status_code=403, detail="External users cannot view missions")
    
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    missions = await db.missions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [MissionResponse(**m) for m in missions]

@api_router.get("/missions/{mission_id}", response_model=MissionResponse)
async def get_mission(mission_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.EXTERNO:
        raise HTTPException(status_code=403, detail="External users cannot view missions")
    
    mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return MissionResponse(**mission)

@api_router.post("/missions/{mission_id}/accept", response_model=MissionResponse)
async def accept_mission(mission_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.EXTERNO:
        raise HTTPException(status_code=403, detail="External users cannot accept missions")
    
    mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    if mission["status"] != MissionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Mission is not available")
    
    await db.missions.update_one(
        {"id": mission_id},
        {"$set": {
            "status": MissionStatus.IN_PROGRESS,
            "assigned_to": user["id"],
            "assigned_username": user["username"]
        }}
    )
    
    updated_mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    return MissionResponse(**updated_mission)

@api_router.post("/missions/{mission_id}/complete", response_model=MissionResponse)
async def complete_mission(mission_id: str, user: dict = Depends(get_current_user)):
    mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    if mission["assigned_to"] != user["id"] and user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not assigned to this mission")
    
    site_status = await check_site_status(mission["target_url"])
    
    if site_status == 200:
        raise HTTPException(status_code=400, detail="Site is still online. Mission cannot be completed.")
    
    await db.missions.update_one(
        {"id": mission_id},
        {"$set": {
            "status": MissionStatus.COMPLETED,
            "site_status": site_status,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"missions_completed": 1, "rank_points": 100}}
    )
    
    updated_mission = await db.missions.find_one({"id": mission_id}, {"_id": 0})
    return MissionResponse(**updated_mission)

@api_router.delete("/missions/{mission_id}")
async def delete_mission(mission_id: str, user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.TENENTE]))):
    result = await db.missions.delete_one({"id": mission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mission not found")
    return {"message": "Mission deleted"}

# ==================== REPORT ROUTES ====================

@api_router.post("/reports", response_model=ReportResponse)
async def create_report(report_data: ReportCreate, user: dict = Depends(get_current_user)):
    report_id = str(uuid.uuid4())
    report_doc = {
        "id": report_id,
        "title": report_data.title,
        "description": report_data.description,
        "target_url": report_data.target_url,
        "category": report_data.category,
        "status": ReportStatus.PENDING,
        "submitted_by": user["id"],
        "submitted_username": user["username"],
        "reviewed_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_at": None,
        "evidence": report_data.evidence
    }
    
    await db.reports.insert_one(report_doc)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"reports_submitted": 1, "rank_points": 10}}
    )
    
    return ReportResponse(**report_doc)

@api_router.get("/reports", response_model=List[ReportResponse])
async def get_reports(
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    if user["role"] == UserRole.EXTERNO:
        query["submitted_by"] = user["id"]
    elif status:
        query["status"] = status
    
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [ReportResponse(**r) for r in reports]

@api_router.post("/reports/{report_id}/accept", response_model=MissionResponse)
async def accept_report(report_id: str, user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.TENENTE, UserRole.ELITE]))):
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report["status"] != ReportStatus.PENDING:
        raise HTTPException(status_code=400, detail="Report already reviewed")
    
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": ReportStatus.ACCEPTED,
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    site_status = await check_site_status(report["target_url"])
    
    mission_id = str(uuid.uuid4())
    mission_doc = {
        "id": mission_id,
        "title": f"[Denúncia] {report['title']}",
        "description": report["description"],
        "target_url": report["target_url"],
        "category": report["category"],
        "priority": "medium",
        "status": MissionStatus.PENDING,
        "site_status": site_status,
        "assigned_to": None,
        "assigned_username": None,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "evidence": report.get("evidence")
    }
    
    await db.missions.insert_one(mission_doc)
    return MissionResponse(**mission_doc)

@api_router.post("/reports/{report_id}/reject")
async def reject_report(report_id: str, user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.TENENTE, UserRole.ELITE]))):
    report = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {
            "status": ReportStatus.REJECTED,
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Report rejected"}

# ==================== TOOL ROUTES ====================

@api_router.post("/tools", response_model=ToolResponse)
async def create_tool(tool_data: ToolCreate, user: dict = Depends(require_roles([UserRole.ADMIN]))):
    tool_id = str(uuid.uuid4())
    tool_doc = {
        "id": tool_id,
        "name": tool_data.name,
        "description": tool_data.description,
        "category": tool_data.category,
        "url": tool_data.url,
        "file_path": None,
        "is_file": tool_data.is_file,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tools.insert_one(tool_doc)
    return ToolResponse(**tool_doc)

@api_router.post("/tools/upload", response_model=ToolResponse)
async def upload_tool(
    name: str,
    description: str,
    category: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    upload_dir = ROOT_DIR / "uploads" / "tools"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    file_path = upload_dir / f"{file_id}{file_extension}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    tool_id = str(uuid.uuid4())
    tool_doc = {
        "id": tool_id,
        "name": name,
        "description": description,
        "category": category,
        "url": None,
        "file_path": str(file_path),
        "is_file": True,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tools.insert_one(tool_doc)
    return ToolResponse(**tool_doc)

@api_router.get("/tools", response_model=List[ToolResponse])
async def get_tools(category: Optional[str] = None, user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.EXTERNO:
        raise HTTPException(status_code=403, detail="External users cannot access tools")
    
    query = {}
    if category:
        query["category"] = category
    
    tools = await db.tools.find(query, {"_id": 0}).to_list(1000)
    return [ToolResponse(**t) for t in tools]

@api_router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: str, user: dict = Depends(require_roles([UserRole.ADMIN]))):
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    if tool.get("file_path"):
        try:
            os.remove(tool["file_path"])
        except Exception:
            pass
    
    await db.tools.delete_one({"id": tool_id})
    return {"message": "Tool deleted"}

# ==================== CHAT ROUTES ====================

@api_router.get("/chat/messages", response_model=List[ChatResponse])
async def get_chat_messages(limit: int = 50, user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()
    # Add default role for old messages without role
    for m in messages:
        if "role" not in m:
            m["role"] = "externo"
    return [ChatResponse(**m) for m in messages]

@api_router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(message: ChatMessage, user: dict = Depends(get_current_user)):
    message_id = str(uuid.uuid4())
    message_doc = {
        "id": message_id,
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "content": message.content,
        "is_ai": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chat_messages.insert_one(message_doc)
    return ChatResponse(**message_doc)

@api_router.post("/chat/ai", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_message_id = str(uuid.uuid4())
    user_message_doc = {
        "id": user_message_id,
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "content": message.content,
        "is_ai": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_message_doc)
    
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"theadmins-chat-{user['id']}",
            system_message="""Você é um assistente de IA especializado em cibersegurança para a equipe The Admins. 
            Você ajuda os membros com:
            - Análise de sites suspeitos
            - Identificação de golpes e fraudes
            - Técnicas de investigação cibernética
            - Ferramentas de segurança
            - Procedimentos de denúncia
            Seja profissional, técnico e útil. Responda em português brasileiro."""
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.content)
        ai_response = await chat.send_message(user_msg)
        
        ai_message_id = str(uuid.uuid4())
        ai_message_doc = {
            "id": ai_message_id,
            "user_id": "ai-assistant",
            "username": "ARIA",
            "role": "ai",
            "content": ai_response,
            "is_ai": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(ai_message_doc)
        
        return ChatResponse(**ai_message_doc)
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get AI response")

# ==================== STATS ROUTES ====================

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    total_missions = await db.missions.count_documents({})
    completed_missions = await db.missions.count_documents({"status": MissionStatus.COMPLETED})
    in_progress_missions = await db.missions.count_documents({"status": MissionStatus.IN_PROGRESS})
    pending_missions = await db.missions.count_documents({"status": MissionStatus.PENDING})
    
    total_reports = await db.reports.count_documents({})
    pending_reports = await db.reports.count_documents({"status": ReportStatus.PENDING})
    
    total_users = await db.users.count_documents({})
    active_members = await db.users.count_documents({"role": {"$ne": UserRole.EXTERNO}})
    
    sites_down = await db.missions.count_documents({"site_status": {"$in": [0, 404]}})
    
    return {
        "missions": {
            "total": total_missions,
            "completed": completed_missions,
            "in_progress": in_progress_missions,
            "pending": pending_missions
        },
        "reports": {
            "total": total_reports,
            "pending": pending_reports
        },
        "users": {
            "total": total_users,
            "active_members": active_members
        },
        "sites_down": sites_down
    }

@api_router.get("/stats/categories")
async def get_category_stats(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    
    mission_stats = await db.missions.aggregate(pipeline).to_list(100)
    report_stats = await db.reports.aggregate(pipeline).to_list(100)
    
    return {
        "missions_by_category": {item["_id"]: item["count"] for item in mission_stats},
        "reports_by_category": {item["_id"]: item["count"] for item in report_stats}
    }

# ==================== BADGES ROUTES ====================

BADGES = [
    {"id": "first_mission", "name": "Primeira Missão", "description": "Completou sua primeira missão", "icon": "target", "requirement_type": "missions", "requirement_value": 1},
    {"id": "hunter_10", "name": "Caçador", "description": "Completou 10 missões", "icon": "crosshair", "requirement_type": "missions", "requirement_value": 10},
    {"id": "hunter_50", "name": "Caçador Elite", "description": "Completou 50 missões", "icon": "award", "requirement_type": "missions", "requirement_value": 50},
    {"id": "hunter_100", "name": "Lenda", "description": "Completou 100 missões", "icon": "crown", "requirement_type": "missions", "requirement_value": 100},
    {"id": "reporter_5", "name": "Informante", "description": "Enviou 5 denúncias", "icon": "alert-triangle", "requirement_type": "reports", "requirement_value": 5},
    {"id": "reporter_25", "name": "Vigilante", "description": "Enviou 25 denúncias", "icon": "eye", "requirement_type": "reports", "requirement_value": 25},
    {"id": "points_500", "name": "Operador", "description": "Alcançou 500 pontos", "icon": "zap", "requirement_type": "points", "requirement_value": 500},
    {"id": "points_2500", "name": "Veterano", "description": "Alcançou 2500 pontos", "icon": "shield", "requirement_type": "points", "requirement_value": 2500},
    {"id": "points_5000", "name": "Mestre", "description": "Alcançou 5000 pontos", "icon": "star", "requirement_type": "points", "requirement_value": 5000},
]

@api_router.get("/badges")
async def get_all_badges(user: dict = Depends(get_current_user)):
    return BADGES

@api_router.get("/badges/user/{user_id}")
async def get_user_badges(user_id: str, user: dict = Depends(get_current_user)):
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    earned_badges = []
    for badge in BADGES:
        if badge["requirement_type"] == "missions" and target_user.get("missions_completed", 0) >= badge["requirement_value"]:
            earned_badges.append(badge)
        elif badge["requirement_type"] == "reports" and target_user.get("reports_submitted", 0) >= badge["requirement_value"]:
            earned_badges.append(badge)
        elif badge["requirement_type"] == "points" and target_user.get("rank_points", 0) >= badge["requirement_value"]:
            earned_badges.append(badge)
    
    return earned_badges

# ==================== FILE UPLOAD FOR TOOLS ====================
from fastapi.responses import FileResponse
import shutil

UPLOAD_DIR = ROOT_DIR / "uploads" / "tools"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@api_router.post("/tools/upload")
async def upload_tool_file(
    name: str,
    description: str,
    category: str,
    file: UploadFile = File(...),
    user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix if file.filename else ""
    filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create tool entry
    tool_id = str(uuid.uuid4())
    tool_doc = {
        "id": tool_id,
        "name": name,
        "description": description,
        "category": category,
        "url": None,
        "file_path": str(file_path),
        "file_name": file.filename,
        "is_file": True,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tools.insert_one(tool_doc)
    return {"id": tool_id, "message": "Tool uploaded successfully", "filename": file.filename}

@api_router.get("/tools/download/{tool_id}")
async def download_tool(tool_id: str, user: dict = Depends(get_current_user)):
    if user["role"] == UserRole.EXTERNO:
        raise HTTPException(status_code=403, detail="External users cannot download tools")
    
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    if not tool.get("is_file") or not tool.get("file_path"):
        raise HTTPException(status_code=400, detail="Tool has no file")
    
    file_path = Path(tool["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=tool.get("file_name", file_path.name),
        media_type="application/octet-stream"
    )

# Include router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Background task for site checking
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_site_check())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
