import datetime
import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="STAFF")
    created_at = Column(DateTime, default=datetime.datetime.now)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    qr_code_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    mobile_number = Column(String, unique=True, nullable=False)
    current_balance = Column(DECIMAL(10, 2), default=0.00)
    created_at = Column(DateTime, default=datetime.datetime.now)

    sessions = relationship("Session", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")
    
class PricePlan(Base):
    __tablename__ = "price_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String, nullable=False)
    duration_min = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    plan_id = Column(Integer, ForeignKey("price_plans.id"))

    start_time = Column(DateTime, default=datetime.datetime.now)
    expected_end_time = Column(DateTime, nullable=False)
    actual_end_time = Column(DateTime, nullable=False)

    status = Column(String, default="ACTIVE")
    cost_deducted = Column(DECIMAL(10, 2), nullable=False)

    customer = relationship("Customer", back_populates="sessions")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))

    transaction_type = Column(String, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_mode = Column(DECIMAL(10,2), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)

    customer = relationship("Customer", back_populates="transactions")