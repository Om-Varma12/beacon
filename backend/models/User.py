from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from Base import Base


class User(Base):
    __tablename__ = "users"

    id:                 Mapped[int]                = mapped_column(primary_key=True)
    cognito_sub:        Mapped[str]                = mapped_column(unique=True)
    email:              Mapped[str]                = mapped_column(unique=True)
    name:               Mapped[Optional[str]]
    created_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    updated_at:         Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    last_login_at:      Mapped[Optional[datetime]]