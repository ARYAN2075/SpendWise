from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from db.database import get_db
from models.transaction import Transaction
from models.user import User
from api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    income_total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income"
        )
        .scalar()
    )

    expense_total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense"
        )
        .scalar()
    )

    balance = income_total - expense_total

    return {
        "total_income": income_total,
        "total_expense": expense_total,
        "balance": balance
    }


@router.get("/category-breakdown")
def category_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    results = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense"
        )
        .group_by(Transaction.category)
        .all()
    )

    return [
        {"category": r[0], "total": r[1]}
        for r in results
    ]


@router.get("/monthly")
def monthly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    results = (
        db.query(
            func.date_trunc("month", Transaction.created_at).label("month"),
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense"
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    return [
        {"month": str(r[0]), "total_expense": r[1]}
        for r in results
    ]