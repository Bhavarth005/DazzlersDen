from db import SessionLocal, engine
import models, auth

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

username = "admin"
password = "adminpassword123"

existing = db.query(models.Admin).filter(models.Admin.username == username).first()
if not existing:
    hashed_pwd = auth.get_password_hash(password)
    new_admin = models.Admin(username=username, password_hash=hashed_pwd, role="superadmin")
    db.add(new_admin)
    db.commit()
    print(f"User '{username}' created successfully.")
else:
    print("User already exists.")

db.close()