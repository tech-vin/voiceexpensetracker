# Contributing to Voice Expense Tracker

Thank you for your interest in contributing. This document covers how to set up a development environment, what areas need help, and the process for submitting changes.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Contribution Scope](#contribution-scope)
- [How to Contribute](#how-to-contribute)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Development Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- Chrome or Edge (required for Web Speech API testing)
- Git

### Fork and clone

```bash
git clone https://github.com/<your-username>/voice-based-expense-tracker.git
cd voice-based-expense-tracker
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Both must be running simultaneously for the app to work.

---

## Contribution Scope

Below are the areas open for contribution, roughly ordered by priority.

---

### 1. Parser Improvements (Good First Issue)

**File:** `backend/parser.py`

The NLP parser uses regex and keyword matching. It handles common Indian English expense patterns but can be improved.

**Open tasks:**
- Expand `KNOWN_NAMES` to cover more common names
- Expand `CATEGORY_MAP` with missing keywords (e.g. gym, school fees, rent)
- Handle Hindi transliteration (e.g. "sabzi" → Grocery, "chai" → Food — some are already there, more can be added)
- Handle shorthand amounts ("1.5k rupees", "2k for shoes")
- Better item extraction when multiple items are mentioned ("tea and biscuits for 50")
- Handle "paisa" as a currency unit

**How to test your parser changes:**

```bash
cd backend
python3 -c "from parser import parse_expense; print(parse_expense('your test phrase here'))"
```

---

### 2. Browser Compatibility (Medium)

**File:** `frontend/src/components/MicButton.jsx`

The current implementation uses the Web Speech API, which only works in Chrome and Edge.

**Open tasks:**
- Add a Whisper-based fallback via `openai-whisper` for Firefox/Safari users
- The fallback would record audio using `MediaRecorder`, send the audio blob to a new backend endpoint `POST /transcribe`, and return the transcript
- The frontend should automatically detect whether Web Speech API is available and switch to the Whisper flow

**Acceptance criteria:**
- Works in Firefox 120+ and Safari 17+
- Adds no extra setup steps for Chrome/Edge users
- Backend endpoint accepts `multipart/form-data` with an audio blob

---

### 3. New Backend Endpoint — Edit Expense (Medium)

**File:** `backend/main.py`

Currently there is no way to correct a mis-parsed expense.

**Open tasks:**
- Add `PATCH /expenses/{id}` accepting `{ item?, amount?, category?, person? }`
- Wire an edit button/form in the frontend's `ExpenseList.jsx`
- Inline edit (click the row to edit in place) is preferred over a modal

---

### 4. Data Export (Medium)

**Files:** `backend/main.py`, `frontend/src/App.jsx`

Users need a way to get their data out.

**Open tasks:**
- `GET /expenses/export?format=csv` — returns a CSV file download
- `GET /expenses/export?format=json` — already possible via `/expenses` but a dedicated endpoint with date range filters would be better
- Add an "Export CSV" button to the frontend dashboard

**CSV format:**

```
Date,Time,Person,Item,Amount,Category,Transcript
2026-06-18,10:30,Self,Petrol,200,Fuel,Spent 200 rupees on petrol
```

---

### 5. Monthly Summary View (Medium)

**Files:** `backend/main.py`, `frontend/src/`

**Open tasks:**
- Add `GET /summary?from=2026-06-01&to=2026-06-30` with optional date range
- Add a simple per-category breakdown in the response
- Show a monthly total card in the frontend alongside today's summary
- No charts required — plain numbers are fine

---

### 6. PWA Support (Medium)

**Files:** `frontend/`

Make the app installable on mobile home screens.

**Open tasks:**
- Add a `manifest.json` with app name, icons, and theme colour
- Register a service worker for basic shell caching (assets only — do not cache API responses)
- Add meta tags to `index.html`
- Test on Android Chrome and iOS Safari

---

### 7. Multi-Language Support (Hard)

**Files:** `backend/parser.py`, `frontend/src/components/MicButton.jsx`

**Open tasks:**
- Add a language selector to the frontend (Hindi, Tamil, Telugu, etc.)
- Pass the selected language to `MicButton` as a prop (`recognition.lang`)
- Extend the parser to handle mixed-language phrases (Hinglish)
- This is complex — coordinate in a GitHub Issue before starting

---

### 8. Tests (Good First Issue)

There are currently no automated tests.

**Open tasks:**

Backend unit tests (`pytest`):
- Test `parse_expense()` against the example phrases in README
- Test the FastAPI endpoints using `httpx` + `TestClient`

Frontend tests (`vitest` + `@testing-library/react`):
- Render smoke tests for `Summary`, `ExpenseList`, `MicButton`
- Mock `window.SpeechRecognition` for `MicButton` tests

**To add backend tests:**
```bash
pip install pytest httpx
# write tests in backend/tests/
pytest backend/tests/
```

---

## How to Contribute

1. **Check existing issues** before starting — someone may already be working on it.
2. **Open an issue first** for anything larger than a bug fix or a one-line change. Describe what you want to do and why.
3. **Fork the repo** and create a branch: `git checkout -b feat/my-feature` or `fix/my-fix`.
4. **Make your changes** — keep the scope focused (one feature or fix per PR).
5. **Test manually** — run both backend and frontend and verify the change works end-to-end.
6. **Submit a PR** against `main` with a clear description (see below).

---

## Code Style

### Python (backend)

- Follow PEP 8
- Use type hints on function signatures
- Keep functions small and focused
- No external NLP libraries (spaCy, NLTK) unless the parser section above explicitly calls for it — the regex approach is intentional

### JavaScript / JSX (frontend)

- Functional components only (no class components)
- `useCallback` and `useRef` where appropriate — avoid unnecessary re-renders
- TailwindCSS utility classes only — no additional CSS files except `index.css`
- No external component libraries (Material UI, Chakra, etc.) — keep the dependency footprint small

---

## Submitting a Pull Request

**PR title format:**
```
feat: add CSV export endpoint
fix: handle no-speech error in MicButton
chore: expand category map with gym and rent
```

**PR description should include:**
- What the change does
- How to test it manually (steps)
- Any trade-offs or known limitations

---

## Reporting Issues

When filing a bug, include:

1. **Browser and version** (e.g. Chrome 126)
2. **OS** (e.g. macOS 14, Windows 11, Ubuntu 22)
3. **What you said** (the voice phrase)
4. **What happened** vs **what you expected**
5. **Browser console errors** (open DevTools → Console)
6. **Backend terminal output** if the issue involves the API

---

## Questions

Open a GitHub Discussion or file an issue with the `question` label.
