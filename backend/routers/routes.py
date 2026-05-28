"""
Routes router: CRUD for saved routes.

Design:
- Routes built by frontend using OSRM (Open Source Routing Machine)
- Geometry stored as JSON [lat, lng] pairs (not GeoJSON [lng, lat])
- Waypoints stored as JSON for frontend UI state reconstruction

Note on geometry format: We use [lat, lng] to match Leaflet's L.latLng convention
and avoid confusion. GeoJSON uses [lng, lat] which is less intuitive for users.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/routes", tags=["routes"])

@router.get("/", response_model=list[schemas.RouteOut])
def get_routes(db: Session = Depends(get_db)):
    """Fetch all saved routes, ordered by most recent first."""
    return db.query(models.Route).order_by(models.Route.created_at.desc()).all()

@router.post("/", response_model=schemas.RouteOut, status_code=status.HTTP_201_CREATED)
def create_route(route: schemas.RouteCreate, db: Session = Depends(get_db)):
    """
    Save a new route.
    
    The geometry field should be JSON-encoded array of [lat, lng] pairs,
    NOT GeoJSON which uses [lng, lat]. This convention matches Leaflet.
    Frontend handles the OSRM to [lat, lng] conversion.
    """
    db_route = models.Route(**route.model_dump())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/{route_id}")
def delete_route(route_id: int, db: Session = Depends(get_db)):
    """Delete a saved route. Returns 404 if not found."""
    db_route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    db.delete(db_route)
    db.commit()
    return {"ok": True}
