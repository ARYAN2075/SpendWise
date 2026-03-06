import re

def parse_expense_text(text: str) -> dict:

    text = text.lower()

    amount_match = re.search(r'\d+(\.\d+)?', text)
    amount = float(amount_match.group()) if amount_match else 0

    category_keywords = {
        "Food": ["food", "lunch", "dinner", "breakfast", "eat", "restaurant", "pizza", "burger", "coffee", "swiggy", "zomato"],
        "Transport": ["uber", "ola", "auto", "cab", "bus", "train", "metro", "petrol", "fuel"],
        "Shopping": ["shopping", "clothes", "shirt", "shoes", "amazon", "flipkart", "bought"],
        "Bills": ["bill", "electricity", "water", "internet", "wifi", "recharge", "mobile"],
        "Entertainment": ["movie", "netflix", "spotify", "game", "concert"],
        "Salary": ["salary", "stipend", "income", "received", "credited"],
        "Investment": ["investment", "mutual fund", "sip", "stock", "shares"],
    }

    category = "Other"
    for cat, keywords in category_keywords.items():
        if any(word in text for word in keywords):
            category = cat
            break

    return {
        "amount": amount,
        "category": category,
        "description": text.strip()
    }