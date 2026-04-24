#!/usr/bin/env python3
"""
Generate encryption keys for the application.

PHASE 3: Use this script to generate secure encryption keys.
"""
import os
import base64
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.security.encryption import EncryptionService


def main():
    print("=" * 60)
    print("Club Task Manager - Encryption Key Generator")
    print("=" * 60)
    print()
    
    # Generate encryption key
    encryption_key = EncryptionService.generate_encryption_key()
    
    print("[OK] Generated new encryption key:")
    print()
    print(f"ENCRYPTION_KEY={encryption_key}")
    print()
    print("IMPORTANT:")
    print("1. Add this to your .env file")
    print("2. Keep this secret! Never commit to version control")
    print("3. In production, store in AWS Secrets Manager or Supabase Vault")
    print("4. Set ENABLE_ENCRYPTION=true to enable encryption")
    print()
    print("=" * 60)
    
    # Test encryption
    print()
    print("Testing encryption...")
    test_data = "This is sensitive data"
    
    # Set the key temporarily for testing
    os.environ["ENCRYPTION_KEY"] = encryption_key
    os.environ["ENABLE_ENCRYPTION"] = "true"
    
    # Force reload of encryption key
    EncryptionService._encryption_key = None
    EncryptionService._aesgcm = None
    
    encrypted = EncryptionService.encrypt(test_data)
    decrypted = EncryptionService.decrypt(encrypted)
    
    print(f"Original:  {test_data}")
    print(f"Encrypted: {encrypted[:50]}...")
    print(f"Decrypted: {decrypted}")
    
    if test_data == decrypted:
        print("[OK] Encryption test passed!")
    else:
        print("[FAIL] Encryption test failed!")
    
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
