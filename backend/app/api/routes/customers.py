"""Customer management API routes (admin only)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.user import User
from app.models.customer import Customer
from app.models.project import Project
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
)


router = APIRouter(prefix="/admin/customers", tags=["admin", "customers"])


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all customers with pagination and search."""
    # Build query
    query = select(Customer)
    count_query = select(func.count(Customer.id))

    # Apply search filter
    if search:
        search_filter = Customer.name.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(Customer.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    # Execute query
    result = await db.execute(query)
    customers = list(result.scalars().all())

    # Add projects count for each customer
    customer_responses = []
    for customer in customers:
        # Count projects for this customer
        projects_count_result = await db.execute(
            select(func.count(Project.id)).where(Project.customer_id == customer.id)
        )
        projects_count = projects_count_result.scalar() or 0

        # Create response with projects count
        customer_dict = {
            "id": customer.id,
            "uuid": customer.uuid,
            "name": customer.name,
            "contact_name": customer.contact_name,
            "contact_phone": customer.contact_phone,
            "email": customer.email,
            "is_active": customer.is_active,
            "created_at": customer.created_at,
            "updated_at": customer.updated_at,
            "projects_count": projects_count,
        }
        customer_responses.append(CustomerResponse(**customer_dict))

    return CustomerListResponse(
        customers=customer_responses,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{customer_uuid}", response_model=CustomerResponse)
async def get_customer(
    customer_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific customer by UUID."""
    result = await db.execute(select(Customer).where(Customer.uuid == customer_uuid))
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # Count projects
    projects_count_result = await db.execute(
        select(func.count(Project.id)).where(Project.customer_id == customer.id)
    )
    projects_count = projects_count_result.scalar() or 0

    # Create response
    customer_dict = {
        "id": customer.id,
        "uuid": customer.uuid,
        "name": customer.name,
        "contact_name": customer.contact_name,
        "contact_phone": customer.contact_phone,
        "email": customer.email,
        "is_active": customer.is_active,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "projects_count": projects_count,
    }

    return CustomerResponse(**customer_dict)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new customer."""
    # Create customer
    customer = Customer(
        name=data.name,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        email=data.email,
        is_active=True,
    )

    db.add(customer)
    await db.commit()
    await db.refresh(customer)

    # Return response
    customer_dict = {
        "id": customer.id,
        "uuid": customer.uuid,
        "name": customer.name,
        "contact_name": customer.contact_name,
        "contact_phone": customer.contact_phone,
        "email": customer.email,
        "is_active": customer.is_active,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "projects_count": 0,
    }

    return CustomerResponse(**customer_dict)


@router.patch("/{customer_uuid}", response_model=CustomerResponse)
async def update_customer(
    customer_uuid: UUID,
    data: CustomerUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a customer."""
    result = await db.execute(select(Customer).where(Customer.uuid == customer_uuid))
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # Update fields
    if data.name is not None:
        customer.name = data.name
    if data.contact_name is not None:
        customer.contact_name = data.contact_name
    if data.contact_phone is not None:
        customer.contact_phone = data.contact_phone
    if data.email is not None:
        customer.email = data.email
    if data.is_active is not None:
        customer.is_active = data.is_active

    await db.commit()
    await db.refresh(customer)

    # Count projects
    projects_count_result = await db.execute(
        select(func.count(Project.id)).where(Project.customer_id == customer.id)
    )
    projects_count = projects_count_result.scalar() or 0

    # Create response
    customer_dict = {
        "id": customer.id,
        "uuid": customer.uuid,
        "name": customer.name,
        "contact_name": customer.contact_name,
        "contact_phone": customer.contact_phone,
        "email": customer.email,
        "is_active": customer.is_active,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "projects_count": projects_count,
    }

    return CustomerResponse(**customer_dict)


@router.delete("/{customer_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_uuid: UUID,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a customer (cascades to projects and documents)."""
    result = await db.execute(select(Customer).where(Customer.uuid == customer_uuid))
    customer = result.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # Check if customer has projects
    projects_count_result = await db.execute(
        select(func.count(Project.id)).where(Project.customer_id == customer.id)
    )
    projects_count = projects_count_result.scalar() or 0

    if projects_count > 0:
        # This is just a warning in the API response headers, not blocking deletion
        # The cascade delete will handle cleanup
        pass

    await db.delete(customer)
    await db.commit()

    return None
