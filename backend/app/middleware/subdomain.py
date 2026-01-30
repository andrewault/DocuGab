"""Subdomain middleware for multi-tenant routing."""

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SubdomainMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract subdomain from request and store in request state.

    For local development, subdomain can be passed via X-Subdomain header.
    In production, it's extracted from the Host header.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check for custom header (useful for local dev)
        subdomain = request.headers.get("X-Subdomain")

        if not subdomain:
            # Extract from Host header
            host = request.headers.get("host", "")
            parts = host.split(".")

            # If we have multiple parts, the first is likely the subdomain
            # e.g., "acme.docutok.com" -> "acme"
            if len(parts) > 2:
                subdomain = parts[0]
            elif len(parts) == 2 and "localhost" not in host:
                # e.g., "acme.localhost" -> "acme"
                subdomain = parts[0]

        # Store subdomain in request state for downstream use
        request.state.subdomain = subdomain

        response = await call_next(request)
        return response
