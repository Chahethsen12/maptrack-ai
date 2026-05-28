"""
Data models for MapTrack AI.

Design notes:
- Place: Simple location marker with category and metadata.
- Route: Built with OSRM, geometry stored as JSON array of [lat, lng] pairs (not GeoJSON).
  Reason: Simpler to parse and render in Leaflet; avoids [lng, lat] coordinate confusion.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Place(Base):
    """A saved location with title, note, and category."""
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="uncategorized")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )


class Route(Base):
    """
    A saved route with waypoints and geometry.
    
    Geometry format: JSON string of [lat, lng] coordinate pairs.
    This differs from GeoJSON's [lng, lat] to avoid confusion in Leaflet.
    """
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance: Mapped[float] = mapped_column(Float, nullable=False)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False, default="#4f8cff")
    waypoints: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list of waypoint dicts
    geometry: Mapped[str] = mapped_column(Text, nullable=False)   # JSON list of [lat, lng] pairs
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

