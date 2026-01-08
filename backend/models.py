import datetime
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db import Base

class Admin(Base):
    __tablename__ = "admins"

    a_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="STAFF")
    created_at = Column(DateTime, default=datetime.datetime.now)
    
    transactions = relationship("Transaction", back_populates="admin")

class Customer(Base):
    __tablename__ = "customers"
    
    c_id = Column(Integer, primary_key=True, index=True)
    qr_code_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    name = Column(String, nullable=False)
    birthdate = Column(DateTime, nullable=False)
    mobile_number = Column(String, unique=True, nullable=False)
    current_balance = Column(Float, default=0.0)
    date = Column(DateTime, default=datetime.datetime.now)

    sessions = relationship("Session", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")

class Session(Base):
    __tablename__ = "sessions"

    s_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.c_id"))

    children = Column(Integer, default=1)
    adults = Column(Integer, default=1)
    discount_percentage = Column(Float, default=0.0)
    discount_reason = Column(String, nullable=True)

    start_time = Column(DateTime, default=datetime.datetime.now)
    duration_hr = Column(Integer, default=1)
    expected_end_time = Column(DateTime, nullable=False)
    actual_end_time = Column(DateTime, nullable=True)

    status = Column(String, default="ACTIVE")
    actual_cost = Column(Float, nullable=False)
    discounted_cost = Column(Float, nullable=False)

    customer = relationship("Customer", back_populates="sessions")

class Transaction(Base):
    __tablename__ = "transactions"

    t_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.c_id"))
    admin_id = Column(Integer, ForeignKey("admins.a_id"))

    transaction_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.datetime.now)

    admin = relationship("Admin", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")