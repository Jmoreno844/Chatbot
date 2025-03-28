from datetime import datetime, timedelta
from typing import Any, Optional, Union

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.middleware.sessions import SessionMiddleware
from fastapi import WebSocket
import json
from app.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Session constants
SESSION_USER_ID_KEY = "user_id"

# JWT constants
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_user_session(request: Request, response: Response, user_id: str) -> None:
    """Create a session for the user"""
    request.session[SESSION_USER_ID_KEY] = user_id
    # Set session expiry (optional)
    request.session.setdefault(
        "expiry",
        (
            datetime.utcnow() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)
        ).timestamp(),
    )


def delete_user_session(request: Request) -> None:
    """Delete the user session"""
    request.session.clear()


async def get_current_user(request: Request):
    """Dependency to get current authenticated user from session"""
    # print("Session data:", request.session)
    # print("Cookies received:", request.cookies)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    user_id = request.session.get(SESSION_USER_ID_KEY)
    if not user_id:
        raise credentials_exception

    # Check session expiry (optional)
    expiry = request.session.get("expiry")
    if expiry and datetime.utcnow().timestamp() > expiry:
        request.session.clear()
        raise credentials_exception

    # Return only the user_id - the actual database lookup will be done in the endpoint
    # This separation allows endpoints to decide which user fields they need
    return {"user_id": user_id}


def parse_session_data(session_cookie: str) -> dict:
    """Parse session data from cookie."""
    # This implementation depends on how your SessionMiddleware serializes sessions
    # For example, with the default Starlette implementation:
    from itsdangerous import Signer
    from starlette.datastructures import MutableHeaders

    signer = Signer(str(settings.SECRET_KEY))
    try:
        data = signer.unsign(session_cookie.encode("utf-8"))
        return json.loads(data)
    except:
        return {}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, str(settings.SECRET_KEY), algorithm=ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, str(settings.SECRET_KEY), algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


async def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to get current user from JWT token"""
    return decode_jwt_token(token)


async def extract_token_from_websocket(websocket: WebSocket) -> str:
    """Extract JWT token from WebSocket connection (query parameters)"""
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
        )
    return token
