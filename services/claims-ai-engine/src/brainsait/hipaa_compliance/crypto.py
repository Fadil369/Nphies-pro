"""AES-256-GCM utilities for PHI field encryption/decryption."""
from __future__ import annotations

import os
from typing import Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _key_from_env() -> bytes:
    key_hex = os.getenv("PHI_AES256_KEY_HEX", "")
    try:
        key = bytes.fromhex(key_hex)
    except ValueError as exc:  # invalid hex string
        raise RuntimeError("PHI_AES256_KEY_HEX must be a valid hex string") from exc

    if len(key) != 32:
        raise RuntimeError("PHI_AES256_KEY_HEX must represent a 32-byte key")
    return key


def encrypt_phi(plaintext: bytes, *, aad: bytes = b"brainsait") -> Tuple[bytes, bytes]:
    """Encrypt PHI payloads using AES-256-GCM."""

    key = _key_from_env()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext, aad)
    return nonce, ciphertext


def decrypt_phi(nonce: bytes, ciphertext: bytes, *, aad: bytes = b"brainsait") -> bytes:
    """Decrypt PHI payloads using AES-256-GCM."""

    key = _key_from_env()
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, aad)
