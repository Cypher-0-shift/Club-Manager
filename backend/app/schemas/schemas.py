from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
from datetime import datetime
import uuid

UserRole = Literal["president", "vp", "secretary", "lead", "member"]
TaskStatus = Literal["pending", "in_progress", "completed", "overdue"]
TaskPriority = Literal["low", "medium", "high", "critical"]
SubmissionType = Literal["file", "url", "text"]


# ──────────────────────────────────────────
# Auth / Users
# ──────────────────────────────────────────
class UserCreate(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole = "member"
    domain_id: Optional[str] = None
    is_approved: bool = False

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    domain_id: Optional[str] = None
    is_approved: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    domain_id: Optional[str]
    is_approved: bool
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime


# ──────────────────────────────────────────
# Domains
# ──────────────────────────────────────────
class DomainCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color_hex: str = "#6366f1"

class DomainUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color_hex: Optional[str] = None

class DomainOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color_hex: str
    created_at: datetime
    updated_at: datetime


# ──────────────────────────────────────────
# Projects
# ──────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    domain_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    domain_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime


# ──────────────────────────────────────────
# Tasks
# ──────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriority = "medium"
    deadline: Optional[datetime] = None
    project_id: str
    assignee_id: Optional[str] = None
    status: TaskStatus = "pending"

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str) -> str:
        if len(v) > 120:
            raise ValueError("Title must not exceed 120 characters")
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    deadline: Optional[datetime] = None
    assignee_id: Optional[str] = None
    is_pinned: Optional[bool] = None

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    deadline: Optional[datetime]
    is_overdue: bool
    is_pinned: bool
    project_id: str
    assignee_id: Optional[str]
    created_by: str
    created_at: datetime
    updated_at: datetime


# ──────────────────────────────────────────
# Submissions
# ──────────────────────────────────────────
class SubmissionCreate(BaseModel):
    type: SubmissionType
    url: Optional[str] = None
    text_content: Optional[str] = None

class SubmissionOut(BaseModel):
    id: str
    task_id: str
    submitted_by: str
    type: SubmissionType
    file_url: Optional[str]
    url: Optional[str]
    text_content: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    created_at: datetime


# ──────────────────────────────────────────
# Messages
# ──────────────────────────────────────────
class MessageCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Message too long")
        return v

class MessageOut(BaseModel):
    id: str
    task_id: str
    sender_id: str
    content: str
    created_at: datetime


# ──────────────────────────────────────────
# API Error envelope
# ──────────────────────────────────────────
class APIError(BaseModel):
    code: str
    message: str
    status: int
    trace_id: str
