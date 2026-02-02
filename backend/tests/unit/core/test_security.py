from app.core import security


def test_password_hashing():
    """Test password hashing and verification."""
    password = "securepassword123"
    hashed = security.hash_password(password)

    # Hash should be different from password
    assert hashed != password
    # Verification should succeed
    assert security.verify_password(password, hashed) is True
    # Verification with wrong password should fail
    assert security.verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    """Test access token creation and decoding."""
    user_id = 123
    token = security.create_access_token(user_id)

    payload = security.decode_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "access"
    assert "exp" in payload


def test_create_refresh_token():
    """Test refresh token creation."""
    user_id = 456
    token, expires_at = security.create_refresh_token(user_id)

    payload = security.decode_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "refresh"
    assert "exp" in payload


def test_invalid_token():
    """Test decoding an invalid token."""
    result = security.decode_token("invalid.token.string")
    assert result is None
