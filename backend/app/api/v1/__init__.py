"""API v1 router - aggregates all v1 API routes."""

from fastapi import APIRouter

from app.api.routes import (
    documents,
    chat,
    auth,
    users,
    admin,
    faq,
    speech,
    customers,
    database,
    avatars,
    images,
)
from app.api.routes import public
from app.api.routes.admin_routes import projects as admin_projects
from app.api.routes.admin_routes import media as admin_media
from app.api.routes.admin_routes import links as admin_links
from app.api.routes.admin_routes import chat_parameters as admin_chat_parameters
from app.api.routes.admin_routes import demo_projects as admin_demo_projects
from app.api.routes.customer_routes import projects as customer_projects
from app.api.routes.customer_routes import account as customer_account

# Create v1 router
router = APIRouter(prefix="/api/v1")

# Include all route modules
router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
router.include_router(database.router, prefix="/admin/database", tags=["Database"])
router.include_router(customers.router, prefix="/admin/customers", tags=["Customers"])
router.include_router(
    admin_projects.router, prefix="/admin/projects", tags=["Admin Projects"]
)
router.include_router(admin_media.router, prefix="/admin", tags=["Admin Projects"])
router.include_router(admin_links.router, prefix="/admin", tags=["Admin Projects"])
router.include_router(
    admin_chat_parameters.router, prefix="/admin/chat-parameters", tags=["Chat Parameters"]
)
router.include_router(
    admin_demo_projects.router, prefix="/admin/demo-projects", tags=["Demo Projects"]
)
router.include_router(
    customer_projects.router, prefix="/customer/projects", tags=["Customer Projects"]
)
router.include_router(
    customer_account.router, prefix="/customer/account", tags=["Customer Account"]
)
router.include_router(documents.router, prefix="/documents", tags=["Documents"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(speech.router, prefix="/speech", tags=["Speech"])
router.include_router(faq.router, prefix="/faq", tags=["FAQ"])
router.include_router(avatars.router, prefix="/admin/avatars", tags=["Avatars"])
router.include_router(
    avatars.customer_router, prefix="/customer/avatars", tags=["Customer Avatars"]
)
router.include_router(images.router, prefix="/images", tags=["Images"])
router.include_router(public.router)
