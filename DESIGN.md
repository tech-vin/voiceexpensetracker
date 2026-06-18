# Design Document — Voice Expense Tracker

## 1. Problem Statement

Manual expense entry creates friction — opening an app, tapping through fields, and typing kills the habit. The goal is to reduce the time-to-log to under 3 seconds using a single natural-language voice command.

---

## 2. System Overview

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Chrome)                  │
│                                                      │
│   ┌─────────────┐    transcript    ┌──────────────┐  │
│   │  Web Speech │ ──────────────► │   React UI   │  │
│   │     API     │                 │  (Vite/TW)   │  │
│   └─────────────┘                 └──────┬───────┘  │
│                                          │ POST      │
└──────────────────────────────────────────┼───────────┘
                                           │ HTTP/JSON
                              ┌────────────▼────────────┐
                              │       FastAPI           │
                              │                         │
                              │  ┌─────────────────┐   │
                              │  │   parser.py     │   │
                              │  │ (regex NLP)     │   │
                              │  └────────┬────────┘   │
                              │           │             │
                              │  ┌────────▼────────┐   │
                              │  │  SQLite via     │   │
                              │  │  SQLAlchemy     │   │
                              │  └─────────────────┘   │
                              └─────────────────────────┘
```

All components run locally. No cloud services, no API keys, no internet required after installation.

---

## 3. Frontend Architecture

### Component Tree

```
App
├── Summary          ← today's total from GET /summary
├── MicButton        ← push-to-talk, speech recognition
└── ExpenseList      ← expense history from GET /expenses
    └── ExpenseItem  ← individual row with delete
```

### State (App.jsx)

| State | Type | Purpose |
|---|---|---|
| `expenses` | `Expense[]` | Full expense list |
| `summary` | `{ total, count }` | Today's aggregated data |
| `status` | `idle \| processing \| success \| error` | Controls feedback UI |
| `lastTranscript` | `string` | Shows what was heard |
| `lastExpense` | `Expense \| null` | Shown in success state |
| `errorMsg` | `string` | Shown in error state |

### Push-to-Talk Flow (MicButton.jsx)

```
pointerdown
    │
    ├─ setPointerCapture(pointerId)   ← ensures pointerup fires even outside button
    └─ recognition.start()
           │
           ├─ onresult → onTranscript(text)
           └─ onend    → if no result: onNoResult()

pointerup / pointercancel
    └─ recognition.stop()
```

`setPointerCapture` is critical for mobile: without it, a finger sliding off the button mid-hold would not fire `pointerup`.

### Speech Recognition Configuration

```js
recognition.lang = 'en-IN'       // Indian English locale
recognition.continuous = false    // auto-ends after speech pause
recognition.interimResults = false // wait for final result only
```

`en-IN` improves recognition of Indian-accented English and handles common terms (rupees, paisa, auto, dal, etc.).

---

## 4. Backend Architecture

### API Layer (main.py)

FastAPI handles routing, request validation (via Pydantic), dependency injection for the database session, and CORS for local development.

### NLP Parser (parser.py)

A pipeline of three regex-based extractors — no ML model required.

#### Amount Extraction

Priority order:
1. `<number> rupees` / `rupees <number>` / `rs <number>` / `₹<number>`
2. `for <number>` (e.g. "bought milk for 60")
3. First number found in the string (fallback)

#### Person Extraction

Scans the transcript for known names from a configurable list (`KNOWN_NAMES`). Defaults to `"Self"` if no name is found.

#### Item Extraction

1. Remove the detected person's name
2. Remove amount patterns (number + currency)
3. Remove all standalone numbers
4. Remove action words and stop words (`bought`, `spent`, `for`, `on`, `the`, `a`, etc.)
5. Title-case the remaining words

#### Category Detection

Keyword lookup against `CATEGORY_MAP` (longest key wins, to avoid partial matches):

| Category | Sample keywords |
|---|---|
| Food | banana, tea, coffee, lunch, dinner, hotel, chai |
| Grocery | milk, rice, dal, flour, vegetables, sabzi |
| Fuel | petrol, diesel, fuel |
| Transport | auto, taxi, cab, rickshaw, metro, fare, uber |
| Health | medicine, doctor, pharmacy, tablet |
| Bills | electricity, internet, recharge, bill |
| Shopping | clothes, shoes, shirt, saree |
| Other | _(default)_ |

### Database Schema

```sql
CREATE TABLE expenses (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT (datetime('now')),
    person    TEXT DEFAULT 'Self',
    item      TEXT NOT NULL,
    amount    REAL NOT NULL,
    category  TEXT DEFAULT 'Other',
    transcript TEXT DEFAULT ''
);
```

`transcript` is stored verbatim so the original speech is always auditable.

---

## 5. Data Flow — Full Round Trip

```
1. User holds mic
       ↓
2. Browser Web Speech API captures audio → produces transcript string
       ↓
3. MicButton fires onTranscript(text)
       ↓
4. App.jsx sets status = "processing", calls POST /voice-expense
       ↓
5. FastAPI receives { transcript }
       ↓
6. parser.parse_expense(transcript) → { person, item, amount, category }
       ↓
7. Expense row inserted into SQLite
       ↓
8. Response { success, expense } returned
       ↓
9. App.jsx sets status = "success", refreshes expense list and summary
       ↓
10. UI shows expense added, list updates
```

---

## 6. Design Decisions

### Why Web Speech API instead of Whisper?

Web Speech API requires no backend processing, no model download, no GPU, and adds zero latency on localhost. Whisper would be better for offline-first or non-Chrome browsers, but significantly increases setup complexity. The trade-off is Chrome/Edge-only.

### Why SQLite instead of PostgreSQL?

This is a local-only, single-user tool. SQLite requires no server process and produces a single portable file. It can handle thousands of expense rows without issue.

### Why regex NLP instead of an LLM?

Expense phrases follow highly predictable patterns. Regex extraction is deterministic, instant, and requires no API key or internet. An LLM would add latency, cost, and a dependency on external services — none of which add value for this use case.

### Why FastAPI + React instead of a single framework?

Separating frontend and backend keeps each concern clean:
- The parser can be tested independently
- The frontend can be replaced (e.g. React Native) without changing the API
- The API can be called from other clients (mobile app, CLI)

---

## 7. Known Limitations

1. **Chrome/Edge only** — Web Speech API is not supported in Firefox or Safari.
2. **Name list is hardcoded** — adding a new person requires editing `KNOWN_NAMES` in `parser.py`.
3. **Single language** — only English (`en-IN`). Hindi/regional language phrases won't parse correctly.
4. **No offline storage** — if the backend is not running, expenses are lost.
5. **No data export** — no CSV or report generation yet.

---

## 8. Future Considerations

These are intentionally left out of the current scope but are natural next steps:

- **Whisper fallback** for Firefox/Safari and offline support
- **Edit expense** inline in the list
- **Date range filters** on the expense list
- **CSV / PDF export** for monthly summaries
- **Recurring expense detection** ("same as last time")
- **Multiple currency support**
- **Progressive Web App (PWA)** for home-screen install on mobile
