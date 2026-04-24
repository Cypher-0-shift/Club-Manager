"""
Encryption Service - AES-256-GCM encryption for sensitive data
"""
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional
from loguru import logger
from app.core.config import settings


class EncryptionService:
    """
    AES-256-GCM encryption service for sensitive data.
    
    PHASE 3: Implements application-level encryption for:
    - Task descriptions
    - Submission text content
    - Any other sensitive user data
    
    Uses AES-256-GCM (Galois/Counter Mode) which provides:
    - Confidentiality (encryption)
    - Authenticity (AEAD - Authenticated Encryption with Associated Data)
    - Integrity (tamper detection)
    """
    
    _encryption_key: Optional[bytes] = None
    _aesgcm: Optional[AESGCM] = None
    
    @classmethod
    def _get_encryption_key(cls) -> bytes:
        """
        Get or derive the encryption key.
        
        PHASE 3: Fetches from secrets manager (AWS/Supabase Vault) or environment.
        
        Returns:
            32-byte encryption key for AES-256
        """
        if cls._encryption_key is None:
            # Try to get from secrets manager first
            from app.core.secrets import get_encryption_key
            
            encryption_key_b64 = get_encryption_key()
            
            if encryption_key_b64:
                try:
                    cls._encryption_key = base64.b64decode(encryption_key_b64)
                    if len(cls._encryption_key) != 32:
                        raise ValueError("Encryption key must be 32 bytes")
                    logger.info("✅ Loaded encryption key from secrets manager")
                except Exception as e:
                    logger.error(f"Failed to load encryption key from secrets manager: {e}")
                    cls._encryption_key = None
            
            # Fallback: Derive from JWT_SECRET (not recommended for production)
            if cls._encryption_key is None:
                logger.warning("⚠️  ENCRYPTION_KEY not set. Deriving from JWT_SECRET (not recommended for production)")
                
                from app.core.config import settings
                
                # Use PBKDF2HMAC to derive a key from JWT_SECRET
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=b"club-task-manager-salt",  # Static salt (should be unique per deployment)
                    iterations=100000,
                    backend=default_backend()
                )
                cls._encryption_key = kdf.derive(settings.JWT_SECRET.encode())
        
        return cls._encryption_key
    
    @classmethod
    def _get_aesgcm(cls) -> AESGCM:
        """Get or create AESGCM cipher instance."""
        if cls._aesgcm is None:
            key = cls._get_encryption_key()
            cls._aesgcm = AESGCM(key)
        return cls._aesgcm
    
    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """
        Encrypt plaintext using AES-256-GCM.
        
        Args:
            plaintext: Text to encrypt
            
        Returns:
            Base64-encoded string in format: nonce||ciphertext||tag
            
        Example:
            encrypted = EncryptionService.encrypt("Sensitive data")
            # Returns: "base64(nonce||ciphertext||tag)"
        """
        if not plaintext:
            return plaintext
        
        try:
            aesgcm = cls._get_aesgcm()
            
            # Generate a random 96-bit nonce (12 bytes)
            nonce = os.urandom(12)
            
            # Encrypt the plaintext
            # AESGCM.encrypt returns ciphertext + authentication tag
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
            
            # Combine nonce + ciphertext and encode as base64
            encrypted_data = nonce + ciphertext
            return base64.b64encode(encrypted_data).decode('utf-8')
        
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError("Failed to encrypt data")
    
    @classmethod
    def decrypt(cls, encrypted_text: str) -> str:
        """
        Decrypt AES-256-GCM encrypted text.
        
        Args:
            encrypted_text: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext
            
        Raises:
            ValueError: If decryption fails (wrong key, tampered data, etc.)
        """
        if not encrypted_text:
            return encrypted_text
        
        try:
            aesgcm = cls._get_aesgcm()
            
            # Decode from base64
            encrypted_data = base64.b64decode(encrypted_text)
            
            # Extract nonce (first 12 bytes) and ciphertext (rest)
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            # Decrypt and verify authentication tag
            plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
            return plaintext_bytes.decode('utf-8')
        
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt data. Data may be corrupted or tampered with.")
    
    @classmethod
    def encrypt_if_enabled(cls, plaintext: Optional[str]) -> Optional[str]:
        """
        Encrypt plaintext only if encryption is enabled.
        
        Useful for gradual rollout or optional encryption.
        
        Args:
            plaintext: Text to encrypt
            
        Returns:
            Encrypted text if encryption is enabled, otherwise original text
        """
        if not plaintext:
            return plaintext
        
        # Check if encryption is enabled
        encryption_enabled = os.getenv("ENABLE_ENCRYPTION", "false").lower() == "true"
        
        if encryption_enabled:
            return cls.encrypt(plaintext)
        else:
            return plaintext
    
    @classmethod
    def decrypt_if_encrypted(cls, text: Optional[str]) -> Optional[str]:
        """
        Decrypt text if it appears to be encrypted.
        
        Detects encryption by checking if the text is valid base64 and has the right length.
        
        Args:
            text: Potentially encrypted text
            
        Returns:
            Decrypted text if encrypted, otherwise original text
        """
        if not text:
            return text
        
        # Simple heuristic: encrypted data is base64 and longer than 24 chars (nonce + minimal ciphertext)
        try:
            if len(text) > 24 and text.replace('+', '').replace('/', '').replace('=', '').isalnum():
                # Try to decrypt
                return cls.decrypt(text)
        except:
            pass
        
        # Not encrypted or decryption failed - return as-is
        return text
    
    @classmethod
    def generate_encryption_key(cls) -> str:
        """
        Generate a new random 256-bit encryption key.
        
        Use this to generate a key for ENCRYPTION_KEY environment variable.
        
        Returns:
            Base64-encoded 32-byte key
            
        Example:
            key = EncryptionService.generate_encryption_key()
            print(f"ENCRYPTION_KEY={key}")
        """
        key = os.urandom(32)
        return base64.b64encode(key).decode('utf-8')
