from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import base64
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_solana_signature(wallet_address: str, message: str, signature: str) -> bool:

    try:
        import base58
        public_key_bytes = base58.b58decode(wallet_address)

        signature_bytes = base64.b64decode(signature)

        verify_key = VerifyKey(public_key_bytes)

        message_bytes = message.encode('utf-8')
        verify_key.verify(message_bytes, signature_bytes)

        return True
    except (BadSignatureError, Exception) as e:
        return False