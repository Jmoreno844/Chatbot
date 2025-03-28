from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    create_user_session,
    delete_user_session,
    get_current_user,
    create_access_token,
)
from app.apps.accounts.schemas import (
    UserLogin,
    UserRegister,
    UserResponse,
    TokenResponse,
)
from app.apps.accounts.model import User
from app.db.base import get_db
import logging

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    request: Request,
    response: Response,
    payload: UserRegister,
    db: Session = Depends(get_db),
) -> UserResponse:
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Create new user instance with hashed password
    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create session for the new user
    create_user_session(request, response, str(new_user.id))

    return UserResponse(
        id=str(new_user.id), email=new_user.email, name=new_user.full_name
    )


@router.post("/login", response_model=UserResponse)
def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db),
) -> UserResponse:
    # Retrieve user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Create session cookie on successful authentication
    create_user_session(request, response, str(user.id))

    return UserResponse(id=str(user.id), email=user.email, name=user.full_name)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request) -> None:
    delete_user_session(request)
    return None


@router.get("/me", response_model=UserResponse)
def get_user_me(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
) -> UserResponse:
    logger.info(" --------------- LOG ----------------- LOG ---------------")
    # Get actual user from database using the user_id from session
    user = db.query(User).filter(User.id == current_user["user_id"]).first()

    # If user doesn't exist in database, raise an exception
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session invalid",
        )

    return UserResponse(id=str(user.id), email=user.email, name=user.full_name)


@router.post("/token", response_model=TokenResponse)
async def get_token_for_user(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a JWT token for the currently authenticated user.

    This endpoint requires the user to be already authenticated via session.
    It returns a JWT token that can be used for API authentication.
    """
    # Get the complete user data from database
    user = db.query(User).filter(User.id == current_user["user_id"]).first()

    # If user doesn't exist in database, raise an exception
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session invalid",
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "email": user.email,
    }
