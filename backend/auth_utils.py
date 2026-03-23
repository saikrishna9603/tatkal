"""
Authentication utilities: JWT, Password hashing, etc.
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

class AuthUtility:
    """Authentication utility functions"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def create_access_token(user_id: str, email: str, full_name: str) -> Dict[str, str]:
        """Create JWT access token"""
        payload = {
            'sub': user_id,
            'email': email,
            'full_name': full_name,
            'type': 'access',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {
            'access_token': token,
            'token_type': 'Bearer',
            'expires_in': ACCESS_TOKEN_EXPIRE_HOURS * 3600
        }
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create JWT refresh token"""
        payload = {
            'sub': user_id,
            'type': 'refresh',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def create_password_reset_token(user_id: str, email: str) -> str:
        """Create password reset token (short-lived)"""
        payload = {
            'sub': user_id,
            'email': email,
            'type': 'password_reset',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(minutes=15)  # 15 minute expiry
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
    
    @staticmethod
    def verify_reset_token(token: str) -> Optional[Dict]:
        """Verify password reset token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('type') != 'password_reset':
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def generate_otp() -> str:
        """Generate 6-digit OTP"""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, bool]:
        """Validate password strength"""
        import re
        
        return {
            'has_length': len(password) >= 8,
            'has_uppercase': bool(re.search(r'[A-Z]', password)),
            'has_lowercase': bool(re.search(r'[a-z]', password)),
            'has_digit': bool(re.search(r'\d', password)),
            'has_special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        }
    
    @staticmethod
    def is_password_strong(password: str) -> bool:
        """Check if password is strong"""
        strength = AuthUtility.validate_password_strength(password)
        return all(strength.values())

class SessionManager:
    """Manage user sessions"""
    
    def __init__(self):
        self.sessions = {}  # In memory, should use Redis in production
    
    def create_session(self, user_id: str, access_token: str, refresh_token: str) -> str:
        """Create user session"""
        session_id = f"session_{user_id}_{datetime.now().timestamp()}"
        
        self.sessions[session_id] = {
            'user_id': user_id,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'created_at': datetime.now(),
            'last_activity': datetime.now(),
            'is_active': True
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session details"""
        return self.sessions.get(session_id)
    
    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate session (logout)"""
        if session_id in self.sessions:
            self.sessions[session_id]['is_active'] = False
            return True
        return False
    
    def refresh_session(self, session_id: str, new_access_token: str) -> bool:
        """Refresh session tokens"""
        if session_id in self.sessions:
            self.sessions[session_id]['access_token'] = new_access_token
            self.sessions[session_id]['last_activity'] = datetime.now()
            return True
        return False
    
    def clear_expired_sessions(self, hours: int = 24) -> int:
        """Clear expired sessions"""
        expired = []
        cutoff = datetime.now() - timedelta(hours=hours)
        
        for session_id, session in self.sessions.items():
            if session['last_activity'] < cutoff:
                expired.append(session_id)
        
        for session_id in expired:
            del self.sessions[session_id]
        
        return len(expired)

# Singleton instance
session_manager = SessionManager()

if __name__ == "__main__":
    print("🔐 Authentication Utility Test\n")
    
    # Test password hashing
    password = "TestPassword123!"
    hashed = AuthUtility.hash_password(password)
    print(f"✓ Password hashed: {hashed[:20]}...")
    print(f"✓ Password verified: {AuthUtility.verify_password(password, hashed)}")
    
    # Test password strength
    strength = AuthUtility.validate_password_strength(password)
    print(f"✓ Password strength: {strength}")
    print(f"✓ Is strong: {AuthUtility.is_password_strong(password)}")
    
    # Test token creation
    tokens = AuthUtility.create_access_token("usr_123", "john@example.com", "John Doe")
    print(f"✓ Access token created: {tokens['access_token'][:20]}...")
    
    # Test token verification
    payload = AuthUtility.verify_token(tokens['access_token'])
    print(f"✓ Token verified: {payload['email']}")
    
    # Test OTP
    otp = AuthUtility.generate_otp()
    print(f"✓ OTP generated: {otp}")
