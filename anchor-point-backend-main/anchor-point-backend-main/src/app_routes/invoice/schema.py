from pydantic import BaseModel
from typing import Optional
from enum import Enum


class InvoiceEvent(Enum):
   INVOICE_CREATED = "invoice_created"
   INVOICE_APPROVED = "invoice_approved"
   INVOICE_REJECTED= "invoice_rejected"
   INVOICE_CREATED_BY_ORGANIZER = "invoice_created_by_organizer"
   INVOICE_CREATED_BY_SUPER_ORGANIZER = "invoice_created_by_super_organizer"


class Invoice(BaseModel):
   driver_cost: Optional[float] = 0.0
   include_additional_distance_cost: Optional[bool] = False
   include_additional_hour_cost: Optional[bool] = False
   discount_percent: Optional[float] = 0.0
   trip_duration: Optional[float] = 0.0
   trip_distance: Optional[float] = 0.0


class InvoiceReject(BaseModel):
   comment: str


class InvoiceStatus(Enum):
   INVOICE_SUCCESS = "Success"
   INVOICE_FAILED = "Failed"
