import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, func, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_model import Base


class User(Base):
    __tablename__ = "users"

    # Use UUID for better security and distributed systems compatibility
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Authentication fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)

    # Profile fields
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)

    # Permission flags
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Audit timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    @property
    def full_name(self):
        """Return user's full name or email if name not set"""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.email

    def __repr__(self):
        return f"<User {self.email}>"
