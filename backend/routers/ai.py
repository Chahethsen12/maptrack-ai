"""
AI integration router.

Endpoints for AI-assisted place categorization and summarization.
- categorize: Suggest category based on place title + note (real-time)
- summarize: Generate overview of all/filtered saved places

Both endpoints use the multi-provider fallback system defined in services.ai_service.
See that module for provider strategy and error handling.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Place
from schemas import (
    CategorizeRequest,
    CategorizeResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from services.ai_service import categorize, summarize

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/categorize", response_model=CategorizeResponse)
async def categorize_place(payload: CategorizeRequest):
    """
    Suggest a place category based on its title and optional note.
    
    Called by frontend during place creation/editing to offer AI-powered categorization.
    Frontend can accept the suggestion or override it. Confidence score helps users
    decide whether to trust the suggestion.
    
    Returns:
        CategorizeResponse with suggested category, provider used, and confidence.
    
    Errors:
        503: All AI providers failed or are misconfigured.
    """
    try:
        result = await categorize(payload.title, payload.note)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return CategorizeResponse(**result)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_places(payload: SummarizeRequest, db: Session = Depends(get_db)):
    """
    Generate an AI summary of saved places.
    
    Helps users discover patterns and insights in their tracked locations.
    Can summarize all places or a filtered subset by place_ids.
    
    Args:
        place_ids: Optional list of place IDs to summarize. If None, uses all places.
        max_places: Max places to include in summary (default 50, max 200).
    
    Returns:
        SummarizeResponse with summary text, provider, and place count.
    
    Errors:
        503: All AI providers failed or are misconfigured.
    """
    query = db.query(Place)

    if payload.place_ids:
        query = query.filter(Place.id.in_(payload.place_ids))

    places_orm = query.order_by(Place.created_at.desc()).limit(payload.max_places).all()

    # Convert ORM objects to plain dicts for the AI service
    places_data = [
        {
            "title": p.title,
            "category": p.category,
            "note": p.note or "",
        }
        for p in places_orm
    ]

    try:
        result = await summarize(places_data)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return SummarizeResponse(**result)
