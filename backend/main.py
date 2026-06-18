from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

import database
from parser import parse_expense

app = FastAPI(title="Voice Expense Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

database.Base.metadata.create_all(bind=database.engine)


class TranscriptRequest(BaseModel):
    transcript: str


def expense_to_dict(e: database.Expense) -> dict:
    return {
        "id": e.id,
        "timestamp": e.timestamp.isoformat(),
        "person": e.person,
        "item": e.item,
        "amount": e.amount,
        "category": e.category,
        "transcript": e.transcript,
    }


@app.post("/voice-expense")
def create_voice_expense(req: TranscriptRequest, db: Session = Depends(database.get_db)):
    parsed = parse_expense(req.transcript)

    if parsed["amount"] is None:
        raise HTTPException(status_code=422, detail="Could not extract amount from transcript")

    expense = database.Expense(
        timestamp=datetime.now(),
        person=parsed["person"],
        item=parsed["item"],
        amount=parsed["amount"],
        category=parsed["category"],
        transcript=req.transcript,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    return {"success": True, "expense": expense_to_dict(expense)}


@app.get("/expenses")
def get_expenses(db: Session = Depends(database.get_db)):
    expenses = (
        db.query(database.Expense)
        .order_by(database.Expense.timestamp.desc())
        .all()
    )
    return [expense_to_dict(e) for e in expenses]


@app.get("/summary")
def get_summary(db: Session = Depends(database.get_db)):
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    today_expenses = (
        db.query(database.Expense)
        .filter(database.Expense.timestamp >= start)
        .all()
    )
    total = sum(e.amount for e in today_expenses)
    return {
        "date": today.isoformat(),
        "total": total,
        "count": len(today_expenses),
    }


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(database.get_db)):
    expense = db.query(database.Expense).filter(database.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"success": True}
