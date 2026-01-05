# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

# Import your own files
import models, schemas, crud
from db import engine, get_db

# Create tables automatically (Fail-safe if you didn't run the script)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dazzler's Den CMS")

# --- CUSTOMER ENDPOINTS ---

@app.post("/customers/", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.Customer).filter(models.Customer.mobile_number == customer.mobile_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers/", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)

# --- WALLET / RECHARGE ENDPOINTS ---

@app.post("/recharge/", response_model=schemas.TransactionResponse)
def recharge_wallet(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # Verify customer exists
    customer = db.query(models.Customer).get(transaction.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return crud.create_recharge(db=db, transaction=transaction)

# --- SESSION / ENTRY ENDPOINTS ---

@app.post("/sessions/start", response_model=schemas.SessionResponse)
def start_session(session_data: schemas.SessionCreate, db: Session = Depends(get_db)):
    # 1. Get the Plan
    plan = db.query(models.PricePlan).get(session_data.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Price Plan not found")
    
    # 2. Find Customer by QR Code
    customer = crud.get_customer_by_uuid(db, session_data.qr_code_uuid)
    if not customer:
        raise HTTPException(status_code=404, detail="Invalid QR Code / Customer not found")

    # 3. Check Balance
    if customer.current_balance < plan.price:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient Balance. Required: {plan.price}, Available: {customer.current_balance}"
        )

    # 4. Start Session (Logic in CRUD)
    return crud.create_session(
        db=db, 
        session_data=session_data, 
        duration_minutes=plan.duration_minutes, 
        cost=plan.price
    )

@app.post("/sessions/{session_id}/exit", response_model=schemas.SessionResponse)
def mark_exit(session_id: int, db: Session = Depends(get_db)):
    session = crud.mark_exit(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# --- DASHBOARD ENDPOINTS ---

@app.get("/dashboard/active", response_model=List[schemas.SessionResponse])
def get_dashboard_data(db: Session = Depends(get_db)):
    return crud.get_active_sessions(db)