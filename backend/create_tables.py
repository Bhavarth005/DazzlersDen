from db import engine, Base
import models

try:
    Base.metadata.create_all(bind=engine)
    print("Success")
except Exception as e:
    print("Error: ", e)
