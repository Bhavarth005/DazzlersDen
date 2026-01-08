from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import auth
import models, schemas, crud
from db import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dazzler's Den CMS")

origins = [
    "http://localhost:3000",      # Local Next.js
    "*" # (For testing only, change in production)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CUSTOMER ENDPOINTS ---

@app.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find Admin
    admin = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    
    # Check Password
    if not admin or not auth.verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate Token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": admin.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/customers/", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate, 
    db: Session = Depends(get_db), 
    current_admin: models.Admin = Depends(auth.get_current_admin)
):
    existing_user = db.query(models.Customer).filter(models.Customer.mobile_number == customer.mobile_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    return crud.create_customer(db=db, customer=customer, admin_id=current_admin.a_id)

@app.get("/customers/", response_model=List[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.Admin = Depends(auth.get_current_admin)):
    return crud.get_customers(db, skip=skip, limit=limit)

# --- WALLET / RECHARGE ENDPOINTS ---

@app.post("/recharge/", response_model=schemas.TransactionResponse)
def recharge_wallet(transaction: schemas.TransactionCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(auth.get_current_admin)):
    # Verify customer exists
    customer = db.query(models.Customer).get(transaction.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    transaction.admin_id = current_admin.a_id
    return crud.create_recharge(db=db, transaction=transaction)

# --- SESSION / ENTRY ENDPOINTS ---

@app.post("/sessions/start", response_model=schemas.SessionResponse)
def start_session(session_data: schemas.SessionCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(auth.get_current_admin)):
    try:
        new_session = crud.create_session(db=db, session_data=session_data)
        if not new_session:
             raise HTTPException(status_code=404, detail="Invalid QR Code / Customer not found")
        return new_session
        
    except ValueError as e:
        # Catches the "Insufficient Balance" error from CRUD
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/sessions/{session_id}/exit", response_model=schemas.SessionResponse)
def mark_exit(session_id: int, db: Session = Depends(get_db), current_admin: models.Admin = Depends(auth.get_current_admin)):
    session = crud.mark_exit(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# --- DASHBOARD ENDPOINTS ---

@app.get("/dashboard/active", response_model=List[schemas.SessionResponse])
def get_dashboard_data(db: Session = Depends(get_db), current_admin: models.Admin = Depends(auth.get_current_admin)):
    return crud.get_active_sessions(db)