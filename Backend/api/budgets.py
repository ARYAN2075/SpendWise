from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime

from db.database import get_db
from models.budget import Budget
from models.transaction import Transaction
from models.user import User
from api.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float


@router.post("/")
def set_budget(
    request: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == request.category
        )
        .first()
    )

    if existing:
        existing.monthly_limit = request.monthly_limit
    else:
        new_budget = Budget(
            user_id=current_user.id,
            category=request.category,
            monthly_limit=request.monthly_limit
        )
        db.add(new_budget)

    db.commit()

    return {"message": "Budget set successfully"}


@router.get("/status/{category}")
def budget_status(
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == category
        )
        .first()
    )

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year

    spent = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.category == category,
            Transaction.type == "expense",
            func.extract("month", Transaction.created_at) == current_month,
            func.extract("year", Transaction.created_at) == current_year
        )
        .scalar()
    )

    percentage = (spent / budget.monthly_limit) * 100

    if percentage >= 100:
        status = "EXCEEDED"
    elif percentage >= 80:
        status = "WARNING"
    else:
        status = "SAFE"

    return {
        "category": category,
        "monthly_limit": budget.monthly_limit,
        "spent": spent,
        "percentage_used": round(percentage, 2),
        "status": status
    }