from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from uuid import UUID
from decimal import Decimal

class CustomerBase(BaseModel):
    name: str
    mobile_number: str
    birthdate: datetime

class CustomerCreate(CustomerBase):
    initial_balance: Optional[float] = 0
    pass

class CustomerResponse(CustomerBase):
    c_id: int
    qr_code_uuid: UUID
    current_balance: float
    date: datetime

    model_config = ConfigDict(from_attributes=True)

class SessionBase(BaseModel):
    children: int
    adults: int
    discount_percentage: Optional[float] = 0.0
    discount_reason: Optional[str] = None
    duration_hr: int
    actual_cost : float
    discounted_cost : float

class SessionCreate(SessionBase):
    qr_code_uuid: UUID 

class SessionResponse(SessionBase):
    s_id: int
    customer_id: int
    start_time: datetime
    expected_end_time: datetime
    actual_end_time: Optional[datetime] = None
    status: str
    
    customer: Optional[CustomerResponse] = None 

    model_config = ConfigDict(from_attributes=True)


class TransactionBase(BaseModel):
    amount: float
    transaction_type: str
    payment_mode: Optional[str] = None
    admin_id: Optional[int] = None
    

class TransactionCreate(TransactionBase):
    customer_id: int 

class TransactionResponse(TransactionBase):
    t_id: int
    customer_id: int
    date: datetime

    model_config = ConfigDict(from_attributes=True)