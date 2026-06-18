import re

CATEGORY_MAP = {
    # Food
    "banana": "Food", "apple": "Food", "mango": "Food", "orange": "Food",
    "tea": "Food", "coffee": "Food", "snacks": "Food", "snack": "Food",
    "lunch": "Food", "dinner": "Food", "breakfast": "Food", "food": "Food",
    "restaurant": "Food", "hotel": "Food", "chai": "Food", "biscuit": "Food",
    "juice": "Food", "water bottle": "Food",
    # Grocery
    "milk": "Grocery", "bread": "Grocery", "rice": "Grocery", "dal": "Grocery",
    "flour": "Grocery", "sugar": "Grocery", "vegetables": "Grocery",
    "vegetable": "Grocery", "sabzi": "Grocery", "grocery": "Grocery",
    "eggs": "Grocery", "egg": "Grocery", "oil": "Grocery",
    # Fuel / Transport
    "petrol": "Fuel", "diesel": "Fuel", "fuel": "Fuel",
    "auto": "Transport", "taxi": "Transport", "cab": "Transport",
    "bus": "Transport", "rickshaw": "Transport", "metro": "Transport",
    "train": "Transport", "uber": "Transport", "ola": "Transport",
    "fare": "Transport", "ticket": "Transport", "auto fare": "Transport",
    # Health
    "medicine": "Health", "doctor": "Health", "medical": "Health",
    "pharmacy": "Health", "hospital": "Health", "tablet": "Health",
    "tablets": "Health",
    # Bills
    "electricity": "Bills", "internet": "Bills", "phone": "Bills",
    "mobile": "Bills", "bill": "Bills", "recharge": "Bills",
    # Shopping
    "clothes": "Shopping", "shirt": "Shopping", "shoes": "Shopping",
    "shopping": "Shopping", "saree": "Shopping",
}

KNOWN_NAMES = [
    "vineet", "priya", "rahul", "amit", "neha", "rohan", "anita",
    "raj", "sunita", "mohan", "ravi", "kavita", "suresh", "pooja",
    "deepak", "anjali", "vivek", "shreya", "arun", "meena",
]

ACTION_WORDS = {
    "purchased", "bought", "spent", "paid", "spend", "buy", "purchase",
    "got", "taken", "ordered", "on", "for", "at", "and", "the", "a", "an",
    "i", "me", "my", "this", "is", "was", "have", "had", "some", "from",
    "in", "to", "of", "with", "rupees", "rs", "inr",
}


def extract_amount(text):
    patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹)',
        r'(?:rupees?|rs\.?|₹)\s*(\d+(?:\.\d+)?)',
        r'for\s+(\d+(?:\.\d+)?)\b',
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return float(m.group(1))
    numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
    if numbers:
        return float(numbers[0])
    return None


def extract_person(text):
    lower = text.lower()
    words = re.findall(r'\b\w+\b', lower)
    for name in KNOWN_NAMES:
        if name in words:
            return name.title()
    return "Self"


def extract_item(text, person):
    cleaned = text.lower()

    if person and person != "Self":
        cleaned = re.sub(r'\b' + re.escape(person.lower()) + r'\b', '', cleaned)

    # Remove amount patterns
    cleaned = re.sub(r'\d+(?:\.\d+)?\s*(?:rupees?|rs\.?|₹)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(?:rupees?|rs\.?|₹)\s*\d+(?:\.\d+)?', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d+(?:\.\d+)?\b', '', cleaned)

    words = re.findall(r'\b[a-z]+\b', cleaned)
    filtered = [w for w in words if w not in ACTION_WORDS and len(w) > 1]

    if filtered:
        return ' '.join(filtered).strip().title()
    return "Unknown"


def get_category(item):
    item_lower = item.lower()
    # Check multi-word keys first (longest match wins)
    for keyword in sorted(CATEGORY_MAP, key=len, reverse=True):
        if keyword in item_lower:
            return CATEGORY_MAP[keyword]
    return "Other"


def parse_expense(transcript: str) -> dict:
    text = transcript.strip()
    amount = extract_amount(text)
    person = extract_person(text)
    item = extract_item(text, person)
    category = get_category(item)

    return {
        "person": person,
        "item": item,
        "amount": amount,
        "category": category,
    }
