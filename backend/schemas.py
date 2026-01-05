from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class PricePlanBase(BaseModel):
    plan_name: str
    duration_minutes: int
    price: Decimal

class PricePlanCreate(PricePlanBase):
    pass

class PricePlanResponse(PricePlanBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CustomerBase(BaseModel):
    name: str
    mobile_number: str
    email: Optional[EmailStr] = None 

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    qr_code_uuid: UUID
    current_balance: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionBase(BaseModel):
    plan_id: int 

class SessionCreate(SessionBase):
    qr_code_uuid: UUID 

class SessionResponse(SessionBase):
    id: int
    customer_id: int
    start_time: datetime
    expected_end_time: datetime
    actual_end_time: Optional[datetime] = None
    status: str
    cost_deducted: Decimal
    
    customer: Optional[CustomerResponse] = None 

    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    amount: Decimal
    transaction_type: str
    payment_mode: Optional[str] = None

class TransactionCreate(TransactionBase):
    customer_id: int 

class TransactionResponse(TransactionBase):
    id: int
    customer_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)