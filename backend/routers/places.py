"""
Places router: CRUD operations on saved locations.

Design:
- Stateless endpoints; all state lives in database
- Filtering by category supported for frontend UI organization
- Timestamps track creation and last modification for audit trail
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Place
from schemas import PlaceCreate, PlaceOut, PlaceUpdate

router = APIRouter(prefix="/places", tags=["places"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_404(place_id: int, db: Session) -> Place:
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=404, detail=f"Place {place_id} not found")
    return place


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[PlaceOut])
def list_places(\n    category: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    """
    Fetch all saved places, ordered by most recent first.
    
    Query parameters:
        category: Optional filter by category name (case-sensitive).
        limit: Max results (default 200).
    """
    query = db.query(Place)
    if category:
        query = query.filter(Place.category == category.lower())
    return query.order_by(Place.created_at.desc()).limit(limit).all()


@router.post("/", response_model=PlaceOut, status_code=status.HTTP_201_CREATED)
def create_place(payload: PlaceCreate, db: Session = Depends(get_db)):
    """Create a new saved place."""
    place = Place(**payload.model_dump())
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


@router.get("/{place_id}", response_model=PlaceOut)
def get_place(place_id: int, db: Session = Depends(get_db)):
    """Fetch a single place by ID. Returns 404 if not found."""
    return _get_or_404(place_id, db)


@router.put("/{place_id}", response_model=PlaceOut)
def update_place(place_id: int, payload: PlaceUpdate, db: Session = Depends(get_db)):
    """
    Partially update a place. Only supplied fields are changed.
    
    This uses Pydantic's exclude_unset=True to allow clients to omit
    fields they don't want to modify, preserving existing values.
    """
    place = _get_or_404(place_id, db)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(place, field, value)
    place.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(place)
    return place


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(place_id: int, db: Session = Depends(get_db)):
    """Delete a place permanently. Returns 404 if not found."""
    place = _get_or_404(place_id, db)
    db.delete(place)
    db.commit()
