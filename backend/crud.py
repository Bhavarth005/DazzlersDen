from sqlalchemy.orm import Session
import models, schemas
from datetime import datetime, timedelta
from uuid import UUID

# --- CUSTOMER ---
def create_customer(db: Session, customer: schemas.CustomerCreate, admin_id: int):
    # 1. Create Customer
    db_customer = models.Customer(
        name=customer.name,
        mobile_number=customer.mobile_number,
        birthdate=customer.birthdate,
        current_balance=customer.initial_balance or 0.0
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    # 2. Add Initial Transaction (If balance > 0)
    if customer.initial_balance and customer.initial_balance > 0:
        db_txn = models.Transaction(
            customer_id=db_customer.c_id,
            admin_id=admin_id,
            transaction_type="RECHARGE",
            amount=customer.initial_balance,
            payment_mode="CASH"
        )
        db.add(db_txn)
        db.commit()
    
    return db_customer

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

# --- RECHARGE ---
def create_recharge(db: Session, transaction: schemas.TransactionCreate):
    # Update Wallet
    customer = db.query(models.Customer).filter(models.Customer.c_id == transaction.customer_id).first()
    if customer:
        customer.current_balance += transaction.amount
    
    # Create Record
    db_txn = models.Transaction(
        customer_id=transaction.customer_id,
        transaction_type=transaction.transaction_type,
        amount=transaction.amount,
        payment_mode=transaction.payment_mode,
        admin_id=transaction.admin_id
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn

# --- SESSIONS ---
def create_customer(db: Session, customer: schemas.CustomerCreate, admin_id: int):
    # 1. Create Customer
    db_customer = models.Customer(
        name=customer.name,
        mobile_number=customer.mobile_number,
        birthdate=customer.birthdate,
        current_balance=customer.initial_balance or 0.0
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer) 

    # 2. Add Initial Transaction (If balance > 0)
    if customer.initial_balance and customer.initial_balance > 0:
        db_txn = models.Transaction(
            customer_id=db_customer.c_id,
            admin_id=admin_id,
            transaction_type="RECHARGE",
            amount=customer.initial_balance,
            payment_mode="CASH"
        )
        db.add(db_txn)
        db.commit()

    # 3. FINAL REFRESH (The Fix)
    # Reload the customer data from DB so it's not None when we return it
    db.refresh(db_customer) 
    
    return db_customer

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

def create_session(db: Session, session_data: schemas.SessionCreate):
    # 1. Find Customer by QR Code
    customer = db.query(models.Customer).filter(models.Customer.qr_code_uuid == session_data.qr_code_uuid).first()
    if not customer:
        return None # Returns 404 in main.py

    # --- NEW CHECK STARTS HERE ---
    # 2. Check for Existing Active Session
    active_session = db.query(models.Session).filter(
        models.Session.customer_id == customer.c_id,
        models.Session.status == "ACTIVE"
    ).first()

    if active_session:
        raise ValueError(f"Customer already has an active session! (Session ID: {active_session.s_id})")
    # --- NEW CHECK ENDS HERE ---

    # 3. Check Balance
    if customer.current_balance < session_data.discounted_cost:
        raise ValueError(f"Insufficient Balance. Required: {session_data.discounted_cost}, Available: {customer.current_balance}")

    # 4. Deduct Money
    customer.current_balance -= session_data.discounted_cost

    # 5. Create Transaction (Deduction)
    db_txn = models.Transaction(
        customer_id=customer.c_id,
        transaction_type="SESSION_DEDUCT",
        amount=session_data.discounted_cost,
        payment_mode=None
    )
    db.add(db_txn)

    # 6. Create Session
    end_time = datetime.now() + timedelta(hours=session_data.duration_hr)
    
    db_session = models.Session(
        customer_id=customer.c_id,
        children=session_data.children,
        adults=session_data.adults,
        discount_percentage=session_data.discount_percentage,
        discount_reason=session_data.discount_reason,
        actual_cost=session_data.actual_cost,
        discounted_cost=session_data.discounted_cost,
        duration_hr=session_data.duration_hr,
        expected_end_time=end_time,
        status="ACTIVE",
        actual_end_time=None 
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session