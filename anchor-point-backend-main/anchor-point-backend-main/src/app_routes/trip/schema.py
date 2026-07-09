from enum import Enum

from pydantic import BaseModel


class TripStatus(Enum):
    STARTED = "started"
    PICKED = "picked"
    DROPPED = "dropped"
    COMPLETED = "completed"
