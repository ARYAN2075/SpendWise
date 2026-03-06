from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from datetime import datetime

from db.database import get_db
from models.transaction import Transaction
from models.user import User
from models.budget import Budget
from api.auth import get_current_user
from services.nlp_service import parse_expense_text

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# -----------------------------
# Request Models
# -----------------------------

class TransactionCreate(BaseModel):
    amount: float
    type: str  # income or expense
    category: str
    description: str | None = None


class SmartExpenseRequest(BaseModel):
    text: str


# -----------------------------
# Create Normal Transaction
# -----------------------------

@router.post("/")
def create_transaction(
    request: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if request.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be income or expense")

    new_transaction = Transaction(
        user_id=current_user.id,
        amount=request.amount,
        type=request.type,
        category=request.category,
        description=request.description,
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    budget_status = None

    # Real-time budget check (only for expense)
    if request.type == "expense":

        budget = (
            db.query(Budget)
            .filter(
                Budget.user_id == current_user.id,
                Budget.category == request.category
            )
            .first()
        )

        if budget:
            current_month = datetime.utcnow().month
            current_year = datetime.utcnow().year

            spent = (
                db.query(func.coalesce(func.sum(Transaction.amount), 0))
                .filter(
                    Transaction.user_id == current_user.id,
                    Transaction.category == request.category,
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

            budget_status = {
                "category": request.category,
                "monthly_limit": budget.monthly_limit,
                "spent": spent,
                "percentage_used": round(percentage, 2),
                "status": status
            }

    return {
        "message": "Transaction added successfully",
        "budget_status": budget_status
    }


# -----------------------------
# Smart NLP Expense Entry
# -----------------------------

@router.post("/smart")
def smart_expense_entry(
    request: SmartExpenseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    parsed = parse_expense_text(request.text)

    if parsed["amount"] == 0:
        raise HTTPException(status_code=400, detail="Could not detect amount")

    new_transaction = Transaction(
        user_id=current_user.id,
        amount=parsed["amount"],
        type="expense",
        category=parsed["category"],
        description=parsed["description"],
    )

    db.add(new_transaction)
    db.commit()

    return {
        "message": "Smart expense added",
        "parsed_data": parsed
    }


# -----------------------------
# Get All Transactions
# -----------------------------

@router.get("/", response_model=List[TransactionCreate])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .all()
    )

    return transactions