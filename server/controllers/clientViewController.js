const Meeting = require('../models/Meeting');
const AiOutput = require('../models/AiOutput');
const Transcript = require('../models/Transcript');
const Client = require('../models/Client');
const UrlService = require('../services/urlService');
const CacheService = require('../services/cacheService');
const logger = require('../utils/logger');

const normalizeStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Generate beautiful HTML for the client
const renderClientPage = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Summary | ${data.meeting.title}</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --card-bg: #141414;
      --border: #262626;
      --text: #ffffff;
      --text-muted: #a3a3a3;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.2);
      --success: #10b981;
      --badge-bg: #1e1e1e;
    }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 32px 24px;
      min-height: 100vh;
    }
    .header {
      margin-bottom: 32px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: var(--badge-bg);
      color: var(--text-muted);
      margin-bottom: 12px;
      border: 1px solid var(--border);
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #fff, #a3a3a3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent);
      margin: 0 0 16px 0;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary-text {
      font-size: 16px;
      color: #e5e5e5;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .list-item {
      position: relative;
      padding-left: 20px;
      margin-bottom: 12px;
      font-size: 15px;
      color: #d4d4d4;
    }
    .list-item::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--accent);
      font-weight: bold;
    }
    .action-box {
      background: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .copy-btn {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      background: var(--text);
      color: var(--bg);
      font-size: 16px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .copy-btn:hover { background: #e5e5e5; transform: translateY(-1px); }
    .copy-btn:active { transform: translateY(1px); }
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${data.client ? data.client.name : 'Unknown Client'}</div>
      <h1 class="title">${data.meeting.title}</h1>
      <p class="subtitle">${new Date(data.meeting.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    ${data.aiOutput ? `
      <div class="card">
        <h2 class="section-title">✨ Executive Summary</h2>
        <p class="summary-text">${data.aiOutput.summary}</p>
      </div>

      <div class="card action-box" id="action-items-card">
        <h2 class="section-title">⚡️ Action Items</h2>
        <ul class="list">
          ${(data.aiOutput.actionItems || []).map(item => `<li class="list-item">${item}</li>`).join('') || '<li class="list-item" style="color:var(--text-muted)">No action items recorded.</li>'}
        </ul>
      </div>

      <div class="card">
        <h2 class="section-title">🎯 Key Decisions</h2>
        <ul class="list">
          ${(data.aiOutput.keyDecisions || []).map(item => `<li class="list-item">${item}</li>`).join('') || '<li class="list-item" style="color:var(--text-muted)">No key decisions recorded.</li>'}
        </ul>
      </div>
    ` : `<div class="card"><p class="summary-text" style="text-align:center">Output is processing or unavailable.</p></div>`}

    <button class="copy-btn" onclick="copyAll()">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
      Copy Summary
    </button>
    <div id="toast" style="display:none; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--success); color:#fff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.2); transition:opacity 0.3s;">Copied to clipboard!</div>

    <div class="footer">
      Powered by Smart Meeting Handshake
    </div>
  </div>

  <script>
    function copyAll() {
      const summary = \`${data.aiOutput ? data.aiOutput.summary.replace(/'/g, "\\'") : ''}\`;
      const actions = ${JSON.stringify(data.aiOutput ? data.aiOutput.actionItems || [] : [])};
      const textToCopy = "Meeting Summary\\n\\n" + summary + "\\n\\nAction Items:\\n" + actions.map(a => "- " + a).join("\\n");
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
      });
    }
  </script>
</body>
</html>`;

class ClientViewController {
  static async getPublicMeeting(req, res, next) {
    try {
      const { token } = req.params;

      const validation = await UrlService.validateToken(token);
      if (!validation.valid) {
        return res.status(404).send('<h1>Invalid or expired share link</h1>');
      }

      const meetingId = validation.meetingId;
      const cacheKey = `public:meeting:${meetingId}`;

      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.send(renderClientPage(cached));
      }

      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).send('<h1>Meeting not found</h1>');
      }

      const client = await Client.findById(meeting.client_id);
      const aiOutput = await AiOutput.findByMeetingId(meetingId);
      const transcript = await Transcript.findByMeetingId(meetingId);

      const response = {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          createdAt: meeting.created_at,
        },
        client: client ? { name: client.name } : null,
        aiOutput: aiOutput ? {
          summary: aiOutput.summary,
          actionItems: normalizeStringArray(aiOutput.action_items),
          keyDecisions: normalizeStringArray(aiOutput.key_decisions),
        } : null,
        transcript: transcript ? transcript.content : null,
      };

      await CacheService.set(cacheKey, response, 300);
      logger.info({ meetingId, token }, 'Public meeting accessed');
      
      // Serve the HTML string inline
      res.send(renderClientPage(response));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClientViewController;
