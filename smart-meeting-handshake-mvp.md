# Smart Meeting Handshake System — MVP Blueprint

---

## 1. System Architecture

> *(Architecture diagram — see original visual in the shared blueprint)*

---

## 2. Database Schema

> *(ERD diagram — see original visual in the shared blueprint)*

### Key Schema Notes

- The `share_token` on meetings is a random UUID (e.g. `nanoid`) — this forms the public URL (`/m/:share_token`).
- `status` values: `pending`, `processing`, `done`, `error`.
- The `source` field on transcripts is either `"text"` or `"audio"`.
- `action_items`, `key_decisions`, `open_questions`, and `next_steps` are **JSONB arrays of strings**, making them trivially renderable on the client.

### Recommended Indexes

```sql
CREATE INDEX idx_meetings_client_id   ON meetings(client_id);
CREATE INDEX idx_meetings_share_token ON meetings(share_token);
CREATE UNIQUE INDEX idx_transcripts_meeting ON transcripts(meeting_id);
CREATE UNIQUE INDEX idx_ai_outputs_meeting  ON ai_outputs(meeting_id);
```

---

## 3. Backend Folder Structure (MVC)

```
/src
  /controllers
    meetingController.js     ← handles HTTP req/res for meeting CRUD
    aiController.js          ← triggers AI processing pipeline
    clientViewController.js  ← serves public share page data
  /models
    Meeting.js               ← DB queries for meetings table
    Client.js                ← DB queries for clients table
    Transcript.js            ← DB queries for transcripts table
    AiOutput.js              ← DB queries for ai_outputs table
  /routes
    meetingRoutes.js         ← /api/meetings/*
    aiRoutes.js              ← /api/meetings/:id/process
    publicRoutes.js          ← /m/:token (public, no auth)
  /services
    aiService.js             ← Gemini API integration + prompt logic
    storageService.js        ← Cloudflare R2 upload/URL generation
    urlService.js            ← generates + validates share tokens
    cacheService.js          ← Redis get/set helpers
  /middlewares
    authMiddleware.js        ← simple API key or JWT check
    errorMiddleware.js       ← central error handler
    validateMiddleware.js    ← Zod/Joi request validation
  /utils
    logger.js                ← structured logging (pino)
    db.js                    ← pg Pool instance
    redis.js                 ← ioredis instance
  app.js                     ← Express setup, middleware chain
  server.js                  ← http.createServer + port bind
```

### Example: `meetingController.js`

```js
// src/controllers/meetingController.js
const Meeting    = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const urlService = require('../services/urlService');

exports.createMeeting = async (req, res, next) => {
  try {
    const { clientName, title } = req.body;
    const shareToken = urlService.generateToken();
    const meeting = await Meeting.create({ clientName, title, shareToken });
    res.status(201).json({ meeting });
  } catch (err) { next(err); }
};

exports.uploadTranscript = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { content } = req.body; // text transcript
    const transcript = await Transcript.upsert({ meetingId, content, source: 'text' });
    res.json({ transcript });
  } catch (err) { next(err); }
};

exports.getMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.findAll({ limit: 50 });
    res.json({ meetings });
  } catch (err) { next(err); }
};

exports.getMeetingResult = async (req, res, next) => {
  try {
    const { token } = req.params;
    const data = await Meeting.findByToken(token, { includeAiOutput: true });
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) { next(err); }
};
```

### Example: `aiService.js`

```js
// src/services/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiOutput   = require('../models/AiOutput');
const Meeting    = require('../models/Meeting');
const Transcript = require('../models/Transcript');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are a meeting analyst. Given a meeting transcript, return ONLY valid JSON.
Schema:
{
  "summary": "2-3 sentence overview",
  "action_items": ["string", ...],
  "key_decisions": ["string", ...],
  "open_questions": ["string", ...],
  "next_steps": ["string", ...]
}
Rules:
- Be concise. Action items must be actionable (verb + owner + deadline hint).
- Return ONLY the JSON object. No markdown, no explanation.
`;

exports.processMeeting = async (meetingId) => {
  await Meeting.updateStatus(meetingId, 'processing');
  const transcript = await Transcript.findByMeetingId(meetingId);
  if (!transcript) throw new Error('No transcript found');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `TRANSCRIPT:\n${transcript.content}` }
  ]);

  const raw = result.response.text();
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

  await AiOutput.upsert({ meetingId, ...parsed });
  await Meeting.updateStatus(meetingId, 'done');
  return parsed;
};
```

---

## 4. API Design

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/meetings` | ✅ | Create a meeting |
| POST | `/api/meetings/:id/transcript` | ✅ | Upload/update transcript |
| POST | `/api/meetings/:id/process` | ✅ | Trigger AI processing |
| GET | `/api/meetings` | ✅ | List all meetings |
| GET | `/api/meetings/:id` | ✅ | Get single meeting + output |
| GET | `/m/:token` | ❌ public | Client view data |
| POST | `/api/meetings/:id/audio` | ✅ | Upload audio file *(MVP optional)* |

### Request / Response Examples

**POST `/api/meetings`**
```
Body:  { "title": "Q3 Proposal", "clientName": "Acme Corp" }
Resp:  { "meeting": { "id": "uuid", "shareToken": "abc123", "status": "pending" } }
```

**POST `/api/meetings/:id/transcript`**
```
Body:  { "content": "Employee: Good morning Maria..." }
Resp:  { "transcript": { "id": "uuid", "meetingId": "...", "source": "text" } }
```

**POST `/api/meetings/:id/process`**
```
Body:  (empty)
Resp:  { "status": "processing" }   ← fires async, poll or push via status
```

**GET `/m/:token`**
```json
{
  "meeting": { "title": "...", "clientName": "..." },
  "output": {
    "summary": "...",
    "action_items": [...],
    "key_decisions": [...],
    "open_questions": [...],
    "next_steps": [...]
  }
}
```

> **MVP note:** AI processing is synchronous — `POST /process` awaits the Gemini call and returns `{ status: "done" }` when complete. Add a job queue (BullMQ) only if you have time.

---

## 5. Mobile App Structure (React Native / Expo)

```
/app
  /screens
    CreateMeetingScreen.tsx   ← form: client name, title, transcript input
    MeetingListScreen.tsx     ← FlatList of meetings, tap to detail
    MeetingDetailScreen.tsx   ← shows AI output: summary, actions, etc.
    ShareScreen.tsx           ← QR code + copy link + NFC label
  /components
    MeetingCard.tsx           ← card component for the list
    AiOutputView.tsx          ← renders summary, bullets, next steps
    QRCodeDisplay.tsx         ← wraps react-native-qrcode-svg
    StatusBadge.tsx           ← pending / processing / done
    CopyLinkButton.tsx        ← copies to clipboard + toast
  /services
    api.ts                    ← axios instance, all API calls
    storage.ts                ← AsyncStorage helpers
  /hooks
    useMeetings.ts            ← fetches + caches meeting list
    useMeetingDetail.ts       ← fetches single meeting + polls status
  /navigation
    AppNavigator.tsx          ← Stack navigator setup
  /constants
    config.ts                 ← BASE_URL, API_KEY
```

### Screen Responsibilities

- **CreateMeetingScreen** — collects client name, meeting title, and text transcript via a multiline `TextInput`. On submit: calls `POST /api/meetings` → `POST /api/meetings/:id/transcript` → `POST /api/meetings/:id/process` → navigates to `ShareScreen`.
- **MeetingListScreen** — shows all past meetings via `useMeetings`, sorted newest first. Each card shows title, client name, created date, and a status badge.
- **MeetingDetailScreen** — displays the full AI output in sections: summary card at top, then bulleted lists for action items, decisions, questions, next steps.
- **ShareScreen** *(most important)* — renders the QR code prominently (200×200), the full share URL as copyable text, and a "NFC Tap" icon (conceptual UI only — tap animation, no actual NFC write in MVP).

---

## 6. Client Web View

Served by the Express backend at `/m/:token` as a **server-side rendered HTML page** (no React/Next.js needed).

The backend route fetches the meeting + AI output, injects it into an HTML template string, and returns it as `text/html`. This makes it load fast on slow mobile connections, requires zero JS framework, and is instantly shareable.

```js
// publicRoutes.js
router.get('/m/:token', async (req, res) => {
  const data = await Meeting.findByToken(req.params.token, { includeAiOutput: true });
  if (!data) return res.status(404).send('<h1>Meeting not found</h1>');
  res.send(renderClientPage(data)); // template function
});
```

### HTML Template Requirements

- Single self-contained file with inline CSS
- System font stack (no external fonts)
- `max-width: 480px`, `padding: 24px`, white background
- Large readable text (`18px` body)
- Action items in a tinted box to stand out
- A "Copy all" button that copies the full output as plain text to clipboard

---

## 7. Key UI Screens

> *(UI mockups — see original visual in the shared blueprint)*

---

## 8. AI Integration — Prompt Templates

**Key principle:** one prompt, one JSON object returned. Never ask Gemini to produce prose then parse it — always force JSON output from the start.

```js
// Full production prompt used in aiService.js
const buildPrompt = (transcript) => `
You are a professional meeting analyst. Your job is to extract structured information from a business meeting transcript.

Return ONLY a valid JSON object — no markdown fences, no preamble, no explanation.

JSON schema (all fields required):
{
  "summary": "2-3 sentence executive summary of the meeting",
  "action_items": [
    "Action item with clear owner and deadline if mentioned",
    ...
  ],
  "key_decisions": [
    "A decision that was made and agreed upon",
    ...
  ],
  "open_questions": [
    "Something that was raised but not resolved",
    ...
  ],
  "next_steps": [
    "Concrete follow-up item to move the relationship forward",
    ...
  ]
}

Rules:
- summary: no more than 3 sentences, neutral tone, no fluff
- action_items: start each with a verb (e.g. "Send", "Review", "Schedule")
- key_decisions: past tense ("Budget was approved", "Team agreed to...")
- open_questions: phrased as a question
- next_steps: future-facing, 1 sentence each
- If a category has no items, return an empty array []
- Do NOT include anything outside the JSON object

TRANSCRIPT:
${transcript}
`;
```

### JSON Parse Error Handling

Wrap `JSON.parse` in a `try/catch`. If it fails, retry once with:
> *"Your previous response was not valid JSON. Return ONLY the JSON object, nothing else."*

If it fails again, save `status: 'error'` to the meeting.

---

## 9. End-to-End Flow

```
1. Employee opens app → taps "New Meeting"
2. Fills in: client name, title, transcript text → taps "Process"
3. App calls: POST /api/meetings → gets meeting ID + share token
4. App calls: POST /api/meetings/:id/transcript → saves transcript
5. App calls: POST /api/meetings/:id/process
   └─ Backend fetches transcript
   └─ Sends to Gemini API with prompt template
   └─ Parses JSON response
   └─ Saves to ai_outputs table
   └─ Updates meeting status = "done"
   └─ Returns { status: "done" }
6. App navigates to ShareScreen
   └─ Renders QR code for URL: https://yourapp.com/m/{shareToken}
   └─ Employee shows QR / copies link
7. Client scans QR with phone camera
   └─ Browser opens https://yourapp.com/m/{shareToken}
   └─ Backend looks up share_token → fetches ai_output
   └─ Returns pre-rendered HTML page
8. Client reads summary + action items instantly
   └─ Taps "Copy all" → pastes into Notes / email
   └─ Can revisit the same URL anytime
```

---

## 10. MVP Simplifications

### What to Mock

- **Authentication** — use a single hardcoded `API_KEY` header check on all employee routes. No user accounts, no login flow.
- **NFC** — show the UI element but don't implement actual NFC write. A label saying "Tap to share" is sufficient for demo.
- **Audio transcription** — accept audio file upload to R2, but don't wire up Whisper/speech-to-text. Log "audio uploaded" and require manual transcript for MVP.

### What to Skip

- Email delivery of results (client just uses the URL)
- Meeting editing after AI processing
- Multi-user / team accounts
- Push notifications when processing completes
- Pagination on meeting list (just return 50 most recent)

### What to Simplify

- Run AI processing **synchronously** (await the Gemini call in the HTTP request) rather than using a job queue. Acceptable for a hackathon — just set a 30-second timeout.
- Serve the client web view as a simple HTML string from Express rather than building a Next.js app.
- Use a single `.env` file for all config — no secrets manager.
- Skip Redis cache for MVP — add it as a 30-minute stretch goal if time permits.

---

## 11. Bonus Implementation Details

### QR Code in React Native

```bash
npx expo install react-native-qrcode-svg
```

```tsx
// ShareScreen.tsx
import QRCode from 'react-native-qrcode-svg';

const shareUrl = `https://yourapp.com/m/${meeting.shareToken}`;

<QRCode
  value={shareUrl}
  size={200}
  color="#000000"
  backgroundColor="#ffffff"
  logo={require('../assets/logo.png')} // optional
/>
```

### Redis Caching Strategy *(Stretch Goal)*

Cache the public meeting result (`GET /m/:token`) for 10 minutes.
- **Key:** `meeting:result:{shareToken}`
- On cache hit → return immediately
- On cache miss → query DB, cache result, return
- Invalidate when `ai_outputs` is written

This matters because clients may share the QR code widely, causing many concurrent scans.

```js
// cacheService.js
exports.getOrSet = async (key, ttlSeconds, fetchFn) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetchFn();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
};

// Usage in publicRoutes.js:
const data = await cacheService.getOrSet(
  `meeting:result:${token}`,
  600,
  () => Meeting.findByToken(token, { includeAiOutput: true })
);
```

### Central Error Handling Middleware

```js
// errorMiddleware.js
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  console.error(`[${req.method}] ${req.path} → ${status}: ${message}`);
  res.status(status).json({ error: message });
};
```

Throw errors with:
```js
const e = new Error('Not found');
e.status = 404;
throw e;
```
The middleware catches everything cleanly.
