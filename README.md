# Voice Expense Tracker

A lightweight, local-first expense tracker where you log expenses by voice — press, speak, release. No typing, no forms.

---

## Demo

```
User holds mic → speaks → releases

"Spent 200 rupees on petrol"
         ↓
{ item: "Petrol", amount: 200, category: "Fuel", person: "Self" }
         ↓
Saved to SQLite · Expense list updates instantly
```

---

## Features

| Feature | Details |
|---|---|
| Push-to-talk | Press & hold mic button, release to process |
| Speech-to-text | Web Speech API (`en-IN` locale — works for Indian English accents) |
| Expense extraction | Regex-based NLP — extracts item, amount, person from natural speech |
| Auto-categorisation | 8 categories: Food, Grocery, Fuel, Transport, Health, Bills, Shopping, Other |
| Multi-person tracking | Detects names spoken in the phrase ("Priya spent 100 on vegetables") |
| Today's summary | Live total spend and count for the current day |
| Expense history | Full list with category badges, person label, timestamp, and original transcript |
| Delete expenses | One-tap delete from the history list |
| No signup required | Runs entirely on your machine |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | FastAPI (Python) |
| Database | SQLite via SQLAlchemy |
| Speech | Web Speech API (browser-native, no API key) |

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Chrome or Edge (Web Speech API is not supported in Firefox/Safari)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.  
API docs available at `http://localhost:8000/docs`.

### 2. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in **Chrome or Edge**.

---

## Usage

### Basic expense entry

Hold the mic button and speak naturally:

```
"Purchased banana for 30 rupees"      → Banana · ₹30 · Food
"Spent 200 rupees on petrol"          → Petrol · ₹200 · Fuel
"Paid 150 for tea and snacks"         → Tea Snacks · ₹150 · Food
"Bought milk for 60 rupees"           → Milk · ₹60 · Grocery
"Auto fare 120 rupees"                → Auto Fare · ₹120 · Transport
"Medicine tablets 80 rupees"          → Medicine Tablets · ₹80 · Health
```

### Multi-person entries

Include the person's name in the phrase:

```
"Vineet bought banana for 30 rupees"  → Vineet · Banana · ₹30
"Priya spent 100 on vegetables"       → Priya · Vegetables · ₹100
```

Recognised names (extensible in `backend/parser.py`):  
Vineet, Priya, Rahul, Amit, Neha, Rohan, Anita, Raj, Sunita, Mohan, Ravi, Kavita, Suresh, Pooja, Deepak, Anjali, Vivek, Shreya, Arun, Meena.

---

## API Reference

### `POST /voice-expense`

Parse a transcript and save the expense.

**Request**
```json
{ "transcript": "Spent 200 rupees on petrol" }
```

**Response**
```json
{
  "success": true,
  "expense": {
    "id": 1,
    "timestamp": "2026-06-18T10:30:00",
    "person": "Self",
    "item": "Petrol",
    "amount": 200.0,
    "category": "Fuel",
    "transcript": "Spent 200 rupees on petrol"
  }
}
```

### `GET /expenses`

Returns all expenses, newest first.

### `GET /summary`

Returns today's total spend and count.

```json
{ "date": "2026-06-18", "total": 580.0, "count": 4 }
```

### `DELETE /expenses/{id}`

Deletes a single expense by ID.

---

## Project Structure

```
voice-based-expense-tracker/
├── backend/
│   ├── main.py          # FastAPI app — routes and request handling
│   ├── database.py      # SQLAlchemy models, SQLite engine, session factory
│   ├── parser.py        # NLP: amount extraction, item extraction, category detection
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Root component, state, API calls
│   │   └── components/
│   │       ├── MicButton.jsx            # Push-to-talk, Web Speech API
│   │       ├── Summary.jsx              # Today's total
│   │       └── ExpenseList.jsx          # History list with delete
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── DESIGN.md
├── CONTRIBUTING.md
└── README.md
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Mic button does nothing | Browser not Chrome/Edge | Switch to Chrome or Edge |
| "Didn't catch that" after speaking | Microphone permission denied | Allow mic at `chrome://settings/content/microphone` |
| "Cannot reach server" | Backend not running | Start `uvicorn main:app --reload` in `backend/` |
| Amount not extracted | Phrase doesn't include a number | Say the amount clearly: "30 rupees" or "rupees 30" |
| Wrong category | Item not in category map | Add it to `CATEGORY_MAP` in `backend/parser.py` |

---

## License

MIT
