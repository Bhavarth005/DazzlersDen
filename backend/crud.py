# backend/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc
import models, schemas
from datetime import datetime
from uuid import UUID

# --- CUSTOMER MANAGEMENT ---

# 1. Create a new customer
def create_customer(db: Session, customer: schemas.CustomerCreate):

    db_customer = models.Customer(
        name=customer.name,
        mobile_number=customer.mobile_number,
        email=customer.email
        # current_balance starts at 0.00 by default
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer) # Get the new ID and UUID back from DB
    return db_customer

# 2. Get all customers
def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

# 3. Find customer by Scanning QR (UUID)
def get_customer_by_uuid(db: Session, qr_uuid: UUID):
    return db.query(models.Customer).filter(models.Customer.qr_code_uuid == qr_uuid).first()

# --- TRANSACTIONS (Money In) ---

# 4. Recharge Balance
def create_recharge(db: Session, transaction: schemas.TransactionCreate):
    # A. Record the transaction history
    db_txn = models.Transaction(
        customer_id=transaction.customer_id,
        transaction_type="RECHARGE",
        amount=transaction.amount,
        payment_mode=transaction.payment_mode
    )
    db.add(db_txn)

    # B. Update the customer's actual balance wallet
    customer = db.query(models.Customer).get(transaction.customer_id)
    customer.current_balance += transaction.amount # Add money
    
    db.commit()
    db.refresh(db_txn)
    return db_txn

# 5. Start a Session
def create_session(db: Session, session_data: schemas.SessionCreate, duration_minutes: int, cost: float):
    # A. Find Customer
    customer = get_customer_by_uuid(db, session_data.qr_code_uuid)
    if not customer:
        return None

    # B. Deduct Money
    customer.current_balance -= cost

    # C. Create Deduction Transaction
    db_txn = models.Transaction(
        customer_id=customer.id,
        transaction_type="SESSION_DEDUCT",
        amount=cost,
        payment_mode=None # Internal deduction
    )
    db.add(db_txn)

    # D. Create Session Record
    expected_end = datetime.now() 

    from datetime import timedelta
    end_time = datetime.now() + timedelta(minutes=duration_minutes)

    db_session = models.Session(
        customer_id=customer.id,
        plan_id=session_data.plan_id,
        expected_end_time=end_time,
        cost_deducted=cost,
        status="ACTIVE"
    )
    db.add(db_session)
    
    db.commit()
    db.refresh(db_session)
    return db_session

# 6. Mark Exit
def mark_exit(db: Session, session_id: int):
    session = db.query(models.Session).get(session_id)
    if session:
        session.actual_end_time = datetime.now()
        session.status = "COMPLETED"
        db.commit()
        db.refresh(session)
    return session

# 7. Get Active Sessions
def get_active_sessions(db: Session):
    return db.query(models.Session).filter(models.Session.actual_end_time == None).all()