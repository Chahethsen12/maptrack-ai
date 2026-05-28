from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Place schemas ────────────────────────────────────────────────────────────

class PlaceBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = None
    category: str = Field(default="uncategorized", max_length=100)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    """All fields optional — only supplied fields are updated."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    note: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)


class PlaceOut(PlaceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Route schemas ────────────────────────────────────────────────────────────

class RouteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    distance: float = Field(..., ge=0)
    duration: float = Field(..., ge=0)
    color: str = Field(default="#4f8cff", max_length=50)
    waypoints: str = Field(...) # JSON array string of waypoints
    geometry: str = Field(...)  # JSON array string of coords

class RouteCreate(RouteBase):
    pass

class RouteOut(RouteBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── AI schemas ───────────────────────────────────────────────────────────────

class CategorizeRequest(BaseModel):
    title: str = Field(..., min_length=1)
    note: Optional[str] = None


class CategorizeResponse(BaseModel):
    category: str
    provider: str          # which AI provider produced this result
    confidence: str        # "high" | "medium" | "low" — model's own self-assessment


class SummarizeRequest(BaseModel):
    place_ids: Optional[list[int]] = None   # None = summarise all places
    max_places: int = Field(default=50, le=200)


class SummarizeResponse(BaseModel):
    summary: str
    provider: str
    place_count: int
