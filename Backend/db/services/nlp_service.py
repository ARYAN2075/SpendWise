import re


CATEGORY_KEYWORDS = {
    "Food": ["food", "coffee", "restaurant", "dinner", "lunch", "pizza"],
    "Travel": ["uber", "ola", "taxi", "bus", "train", "flight"],
    "Entertainment": ["movie", "netflix", "game", "concert"],
    "Shopping": ["amazon", "flipkart", "shopping", "clothes"],
    "Health": ["hospital", "medicine", "doctor", "pharmacy"],
}


def detect_category(text: str) -> str:
    text = text.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        for word in keywords:
            if word in text:
                return category

    return "Other"


def extract_amount(text: str) -> float:
    match = re.search(r"\d+(\.\d+)?", text)
    if match:
        return float(match.group())
    return 0.0


def parse_expense_text(text: str):
    amount = extract_amount(text)
    category = detect_category(text)

    return {
        "amount": amount,
        "type": "expense",
        "category": category,
        "description": text
    }