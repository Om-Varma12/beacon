from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_session
from db.UserRepository import UserRepository
from utils.auth import get_current_user_claims

router = APIRouter()

def get_user_repo(session: AsyncSession = Depends(get_session)):
    return UserRepository(session)

@router.get("/me")
async def get_or_create_me(
    claims: dict = Depends(get_current_user_claims),
    repo: UserRepository = Depends(get_user_repo)
):
    if claims.get("token_use") != "id":
        raise HTTPException(status_code=400, detail="Only ID tokens are accepted on this endpoint")
        
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name")
    
    if not cognito_sub or not email:
        raise HTTPException(status_code=400, detail="Missing required claims (sub, email) in token")
        
    if not name:
        name = email.split("@")[0]
        
    user = await repo.get_or_create_user(cognito_sub=cognito_sub, email=email, name=name)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to fetch or create user in database")
        
    return {
        "success": True,
        "name": user["name"],
        "email": user["email"]
    }
