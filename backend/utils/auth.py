import os
import httpx
import asyncio
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "ap-south-1_NTT4B3WFb")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "4hg51l3srlfeq4kes57ruq5e6h")
COGNITO_REGION = COGNITO_USER_POOL_ID.split("_")[0] if "_" in COGNITO_USER_POOL_ID else "ap-south-1"

JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

_jwks_cache = None
_jwks_cache_lock = asyncio.Lock()

async def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        async with _jwks_cache_lock:
            if _jwks_cache is None:
                try:
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(JWKS_URL, timeout=5.0)
                        resp.raise_for_status()
                        _jwks_cache = resp.json()
                except Exception as e:
                    print(f"Error fetching JWKS from Cognito: {e}")
                    raise HTTPException(
                        status_code=500,
                        detail="Could not verify credentials with authentication server"
                    )
    return _jwks_cache

security = HTTPBearer()

async def verify_token(token: str):
    """Verify JWT token and return claims. Used for SSE where token is passed as query param."""
    jwks = await get_jwks()
    
    try:
        # Get token header to find the kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header: missing kid")
        
        # Find matching key in JWKS
        key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
        if not key_data:
            # Refresh JWKS cache and try again
            global _jwks_cache
            async with _jwks_cache_lock:
                _jwks_cache = None
            jwks = await get_jwks()
            key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
            
            if not key_data:
                raise HTTPException(status_code=401, detail="Token signature key not found")
        
        # Construct public key
        public_key = RSAAlgorithm.from_jwk(key_data)
        
        # Verify and decode
        issuer = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}, # Verified manually
            issuer=issuer
        )
        
        # Verify token_use
        token_use = decoded.get("token_use")
        if token_use not in ["id", "access"]:
            raise HTTPException(status_code=401, detail="Invalid token use claim")
            
        if token_use == "id":
            # Verify client ID (audience) for ID token
            aud = decoded.get("aud")
            if aud != COGNITO_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token audience")
        elif token_use == "access":
            # Verify client ID for Access token
            client_id = decoded.get("client_id")
            if client_id != COGNITO_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token client ID")
                
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def get_current_user_claims(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    jwks = await get_jwks()
    
    try:
        # Get token header to find the kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid token header: missing kid")
        
        # Find matching key in JWKS
        key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
        if not key_data:
            # Refresh JWKS cache and try again
            global _jwks_cache
            async with _jwks_cache_lock:
                _jwks_cache = None
            jwks = await get_jwks()
            key_data = next((key for key in jwks.get("keys", []) if key.get("kid") == kid), None)
            
            if not key_data:
                raise HTTPException(status_code=401, detail="Token signature key not found")
        
        # Construct public key
        public_key = RSAAlgorithm.from_jwk(key_data)
        
        # Verify and decode
        issuer = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}, # Verified manually
            issuer=issuer
        )
        
        # Verify token_use
        token_use = decoded.get("token_use")
        if token_use not in ["id", "access"]:
            raise HTTPException(status_code=401, detail="Invalid token use claim")
            
        if token_use == "id":
            # Verify client ID (audience) for ID token
            aud = decoded.get("aud")
            if aud != COGNITO_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token audience")
        elif token_use == "access":
            # Verify client ID for Access token
            client_id = decoded.get("client_id")
            if client_id != COGNITO_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Invalid token client ID")
                
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
