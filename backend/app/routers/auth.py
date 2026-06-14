from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import RegisterSchema, LoginSchema, TokenSchema, UserOut
from ..services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from datetime import datetime, timezone

router = APIRouter()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register", response_model=UserOut)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenSchema)
def login(data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, samesite="strict", max_age=60*60*24*7
    )
    return {"access_token": access_token}


@router.post("/refresh", response_model=TokenSchema)
def refresh(request: Request):
    token = request.cookies.get("refresh_token")
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return {"access_token": create_access_token({"sub": payload["sub"]})}


@router.post("/guest-login", response_model=TokenSchema)
def guest_login(response: Response, db: Session = Depends(get_db)):
    guest_username = "guest_user"
    guest_password = "guest_autods_2026"
    user = db.query(User).filter(User.username == guest_username).first()
    if not user:
        user = User(
            username=guest_username,
            hashed_password=hash_password(guest_password),
            full_name="Guest"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, samesite="strict", max_age=60*60*24*7
    )
    return {"access_token": access_token}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
