(function () {
  'use strict';

  if (document.getElementById('pc-root')) return;

  const MARKED_SRC = chrome.runtime.getURL('lib/marked.min.js');
  const API_KEY_STORAGE = 'pc_api_key';
  const MODEL_STORAGE = 'pc_model';

  const CSS = `
#pc-root, #pc-root *, #pc-root *::before, #pc-root *::after {
  all: initial;
  box-sizing: border-box;
}
#pc-root {
  --bg: #0d1117;
  --bg2: #161b22;
  --bg3: #21262d;
  --bg4: #30363d;
  --border: #30363d;
  --text: #e6edf3;
  --text2: #8b949e;
  --text3: #6e7681;
  --accent: #58a6ff;
  --accent2: #388bfd;
  --accent-dim: rgba(56,139,253,0.15);
  --green: #3fb950;
  --red: #f85149;
  --yellow: #d29922;
  --radius: 8px;
  --radius-sm: 6px;
  position: fixed;
  top: 0; right: 0; bottom: 0; z-index: 2147483647;
  font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  direction: ltr;
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 32px rgba(0,0,0,0.5);
}
#pc-toggle-btn {
  position: fixed;
  right: 0; top: 45%;
  z-index: 2147483646;
  width: 28px; height: 64px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text2); transition: all 0.2s;
  writing-mode: vertical-rl; text-orientation: mixed;
  font-size: 11px; font-weight: 500; letter-spacing: 0.5px; gap: 4px;
}
#pc-toggle-btn:hover { background: var(--bg3); color: var(--accent); }
#pc-toggle-btn svg { width: 14px; height: 14px; }

/* Header */
#pc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  height: 52px;
}
#pc-logo {
  font-size: 14px; font-weight: 600; color: var(--text);
  display: flex; align-items: center; gap: 8px;
}
#pc-logo-icon {
  width: 24px; height: 24px;
  background: linear-gradient(135deg, var(--accent), #79c0ff);
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
}
#pc-logo-icon svg { width: 14px; height: 14px; color: white; }
#pc-header-actions { display: flex; align-items: center; gap: 4px; }
.pc-icon-btn {
  width: 32px; height: 32px;
  background: none; border: none; cursor: pointer;
  color: var(--text2); border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pc-icon-btn:hover { background: var(--bg3); color: var(--text); }
.pc-icon-btn svg { width: 16px; height: 16px; }

/* Status bar */
#pc-status-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
  font-size: 11px; color: var(--text2);
  flex-shrink: 0;
  min-height: 36px;
}
#pc-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text3); flex-shrink: 0;
}
#pc-status-dot.ready { background: var(--green); }
#pc-status-dot.error { background: var(--red); }
#pc-status-dot.loading { background: var(--yellow); animation: pc-pulse 1s infinite; }
@keyframes pc-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
#pc-status-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#pc-model-badge {
  padding: 2px 8px; background: var(--bg4); border-radius: 12px;
  font-size: 10px; color: var(--text2); max-width: 120px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Messages area */
#pc-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 16px;
}
#pc-messages::-webkit-scrollbar { width: 6px; }
#pc-messages::-webkit-scrollbar-track { background: transparent; }
#pc-messages::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 3px; }
#pc-messages::-webkit-scrollbar-thumb:hover { background: var(--text3); }

/* Message bubbles */
.pc-msg-row { display: flex; gap: 10px; align-items: flex-start; }
.pc-msg-row.user { flex-direction: row-reverse; }
.pc-avatar {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600;
}
.pc-avatar.ai { background: var(--accent-dim); color: var(--accent); }
.pc-avatar.user { background: var(--bg4); color: var(--text2); }
.pc-msg-body { max-width: 85%; }
.pc-msg-bubble {
  padding: 10px 14px; border-radius: var(--radius);
  font-size: 13px; line-height: 1.6; word-wrap: break-word;
  animation: pc-msg-in 0.15s ease;
}
@keyframes pc-msg-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.pc-msg-row.user .pc-msg-bubble {
  background: var(--bg3); border: 1px solid var(--border);
  border-bottom-right-radius: 4px; color: var(--text);
}
.pc-msg-row.ai .pc-msg-bubble {
  background: var(--bg2); border: 1px solid var(--border);
  border-bottom-left-radius: 4px; color: var(--text);
}
.pc-msg-row.ai .pc-msg-bubble.error {
  border-color: var(--red); background: rgba(248,81,73,0.08);
}
.pc-msg-role {
  font-size: 10px; font-weight: 600; color: var(--text3);
  margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
}
.pc-msg-row.ai .pc-msg-role { color: var(--accent); }

/* Markdown content */
.pc-msg-body h1,.pc-msg-body h2,.pc-msg-body h3,.pc-msg-body h4 {
  margin: 10px 0 6px; color: var(--text); line-height: 1.4;
}
.pc-msg-body h1 { font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.pc-msg-body h2 { font-size: 14px; }
.pc-msg-body h3 { font-size: 13px; }
.pc-msg-body h4 { font-size: 12px; }
.pc-msg-body p { margin: 4px 0; }
.pc-msg-body ul,.pc-msg-body ol { margin: 6px 0; padding-left: 20px; }
.pc-msg-body li { margin: 2px 0; }
.pc-msg-body code {
  background: var(--bg4); padding: 1px 6px; border-radius: 4px;
  font-size: 12px; font-family: 'SF Mono',Menlo,monospace; color: #79c0ff;
}
.pc-msg-body pre {
  background: #0d1117; border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 12px; margin: 8px 0;
  overflow-x: auto; position: relative;
}
.pc-msg-body pre code { background: none; padding: 0; color: var(--text); font-size: 12px; }
.pc-code-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: var(--bg3); border-bottom: 1px solid var(--border);
  margin: -12px -12px 8px -12px; border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}
.pc-code-lang { font-size: 11px; color: var(--text3); font-weight: 500; }
.pc-copy-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: var(--bg4); border: none; border-radius: 4px;
  color: var(--text3); font-size: 10px; cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.pc-copy-btn:hover { color: var(--text); background: var(--border); }
.pc-copy-btn svg { width: 10px; height: 10px; }
.pc-msg-body blockquote {
  border-left: 3px solid var(--accent); margin: 8px 0; padding: 6px 12px;
  background: var(--accent-dim); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text2);
}
.pc-msg-body a { color: var(--accent); text-decoration: none; }
.pc-msg-body a:hover { text-decoration: underline; }
.pc-msg-body table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
.pc-msg-body th,.pc-msg-body td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
.pc-msg-body th { background: var(--bg3); font-weight: 600; }
.pc-msg-body hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
.pc-msg-body strong { font-weight: 600; color: var(--text); }
.pc-msg-body em { font-style: italic; }

/* Typing indicator */
.pc-typing-row { display: flex; gap: 10px; align-items: flex-start; }
.pc-typing-dots { display: flex; gap: 4px; padding: 14px; }
.pc-typing-dots span {
  width: 6px; height: 6px; background: var(--text3); border-radius: 50%;
  animation: pc-bounce 1.2s infinite;
}
.pc-typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.pc-typing-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes pc-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

/* Welcome screen */
.pc-welcome {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 40px 24px; gap: 12px; flex: 1;
}
.pc-welcome-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--accent-dim); display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.pc-welcome-icon svg { width: 28px; height: 28px; color: var(--accent); }
.pc-welcome h2 { font-size: 18px; font-weight: 600; color: var(--text); margin: 0; }
.pc-welcome p { font-size: 13px; color: var(--text2); margin: 0; max-width: 280px; line-height: 1.5; }
.pc-welcome-model {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 20px; font-size: 12px; color: var(--text2);
}
.pc-welcome-model .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.pc-quick-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
.pc-quick-btn {
  padding: 8px 16px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: 20px; color: var(--text2); font-size: 12px;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.pc-quick-btn:hover { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }

/* Input area */
#pc-input-area {
  padding: 12px 16px; background: var(--bg2);
  border-top: 1px solid var(--border); flex-shrink: 0;
}
#pc-input-wrap {
  display: flex; gap: 8px; align-items: flex-end;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 4px; transition: border-color 0.15s;
}
#pc-input-wrap:focus-within { border-color: var(--accent); }
#pc-user-input {
  flex: 1; resize: none; background: none; border: none; outline: none;
  padding: 8px 10px; color: var(--text); font-size: 13px;
  font-family: inherit; line-height: 1.5; max-height: 100px;
}
#pc-user-input::placeholder { color: var(--text3); }
#pc-send-btn {
  width: 36px; height: 36px; border-radius: 6px; border: none;
  background: var(--accent); color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
#pc-send-btn:hover:not(:disabled) { background: var(--accent2); }
#pc-send-btn:disabled { background: var(--bg4); color: var(--text3); cursor: not-allowed; }
#pc-send-btn svg { width: 16px; height: 16px; }

/* Settings panel */
#pc-settings {
  display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 20px 16px;
}
#pc-settings.show { display: flex; }
#pc-settings-title {
  font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 20px;
  display: flex; align-items: center; gap: 8px;
}
.pc-field { margin-bottom: 16px; }
.pc-field label {
  display: block; font-size: 12px; font-weight: 500; color: var(--text2);
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.pc-field input, .pc-field select {
  width: 100%; padding: 10px 12px; background: var(--bg3);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text); font-size: 13px; font-family: inherit;
  outline: none; transition: border-color 0.15s;
}
.pc-field input:focus, .pc-field select:focus { border-color: var(--accent); }
.pc-field select {
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238b949e' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px; background-color: var(--bg3);
}
.pc-field-hint { font-size: 11px; color: var(--text3); margin-top: 4px; }
.pc-input-row { position: relative; }
.pc-input-row input { padding-right: 40px; }
.pc-toggle-vis {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text3);
  padding: 4px; display: flex; border-radius: 4px;
}
.pc-toggle-vis:hover { color: var(--text2); }
.pc-toggle-vis svg { width: 14px; height: 14px; }
.pc-save-btn {
  width: 100%; padding: 12px; background: var(--accent); color: white;
  border: none; border-radius: var(--radius-sm); font-size: 13px;
  font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
  margin-top: 8px;
}
.pc-save-btn:hover { background: var(--accent2); }
.pc-status-msg { margin-top: 12px; font-size: 12px; text-align: center; min-height: 20px; }
.pc-status-msg.ok { color: var(--green); }
.pc-status-msg.err { color: var(--red); }
.pc-loading-models { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); }
.pc-loading-models .spinner { width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: pc-spin 0.6s linear infinite; }
@keyframes pc-spin { to{transform:rotate(360deg)} }
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = 'pc-root';
  root.innerHTML = `
    <div id="pc-header">
      <div id="pc-logo">
        <div id="pc-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <span>PageChat AI</span>
      </div>
      <div id="pc-header-actions">
        <button id="pc-settings-btn" class="pc-icon-btn" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <button id="pc-close-btn" class="pc-icon-btn" title="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <div id="pc-status-bar">
      <div id="pc-status-dot" class="loading"></div>
      <span id="pc-status-text">Initializing...</span>
      <span id="pc-model-badge">-</span>
    </div>

    <div id="pc-messages">
      <div class="pc-welcome" id="pc-welcome-screen">
        <div class="pc-welcome-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h2>Ask about this page</h2>
        <p>I've read the content. Type a message to start chatting with AI about this page.</p>
        <div class="pc-welcome-model" id="pc-welcome-model">
          <span class="dot"></span>
          <span id="pc-welcome-model-name">No model set</span>
        </div>
        <div class="pc-quick-actions">
          <button class="pc-quick-btn" data-pc-prompt="Summarize this page in 3-5 bullet points">Summarize</button>
          <button class="pc-quick-btn" data-pc-prompt="What are the key points of this page?">Key Points</button>
          <button class="pc-quick-btn" data-pc-prompt="Explain this page like I'm 10 years old">ELI5</button>
        </div>
      </div>
    </div>

    <div id="pc-input-area">
      <div id="pc-input-wrap">
        <textarea id="pc-user-input" placeholder="Ask about this page..." rows="1"></textarea>
        <button id="pc-send-btn" title="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

    <div id="pc-settings">
      <div id="pc-settings-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Settings
      </div>

      <div class="pc-field">
        <label>OpenRouter API Key</label>
        <div class="pc-input-row">
          <input type="password" id="pc-api-key" placeholder="sk-or-v1-..." autocomplete="off">
          <button id="pc-toggle-vis" class="pc-toggle-vis" title="Show/Hide key">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <span class="pc-field-hint">Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" style="color:var(--accent)">openrouter.ai/keys</a></span>
      </div>

      <div class="pc-field" id="pc-model-field" style="display:none">
        <label>Model</label>
        <select id="pc-model-select">
          <option value="">Loading models...</option>
        </select>
        <div id="pc-models-loading" class="pc-loading-models">
          <div class="spinner"></div>
          <span>Loading available models...</span>
        </div>
      </div>

      <div id="pc-no-key-msg" style="padding:16px;background:var(--bg3);border-radius:var(--radius);text-align:center;color:var(--text2);font-size:13px;margin-bottom:16px">
        Enter your API key above and click Save to load available models.
      </div>

      <button id="pc-save-btn" class="pc-save-btn">Save Settings</button>
      <div id="pc-settings-status" class="pc-status-msg"></div>
    </div>
  `;

  document.body.appendChild(root);

  const toggleBtn = document.createElement('div');
  toggleBtn.id = 'pc-toggle-btn';
  toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Chat`;
  toggleBtn.title = 'Open PageChat AI';
  toggleBtn.addEventListener('click', openSidebar);
  document.body.appendChild(toggleBtn);

  const sidebar = root;
  const closeBtn = document.getElementById('pc-close-btn');
  const settingsBtn = document.getElementById('pc-settings-btn');
  const settingsPanel = document.getElementById('pc-settings');
  const chatArea = document.getElementById('pc-messages');
  const welcomeScreen = document.getElementById('pc-welcome-screen');
  const statusDot = document.getElementById('pc-status-dot');
  const statusText = document.getElementById('pc-status-text');
  const modelBadge = document.getElementById('pc-model-badge');
  const welcomeModelName = document.getElementById('pc-welcome-model-name');
  const apiKeyInput = document.getElementById('pc-api-key');
  const modelSelect = document.getElementById('pc-model-select');
  const modelField = document.getElementById('pc-model-field');
  const noKeyMsg = document.getElementById('pc-no-key-msg');
  const modelsLoading = document.getElementById('pc-models-loading');
  const toggleVisBtn = document.getElementById('pc-toggle-vis');
  const saveBtn = document.getElementById('pc-save-btn');
  const settingsStatus = document.getElementById('pc-settings-status');
  const userInput = document.getElementById('pc-user-input');
  const sendBtn = document.getElementById('pc-send-btn');

  let chatMessages = [];
  let pageContent = null;
  let currentModel = '';
  let isProcessing = false;
  let markedReady = false;
  let modelsLoaded = false;

  function loadMarked() {
    return new Promise((resolve) => {
      if (markedReady) return resolve();
      const s = document.createElement('script');
      s.src = MARKED_SRC;
      s.onload = () => {
        markedReady = true;
        marked.setOptions({ breaks: true, gfm: true });
        const origCode = marked.Renderer.prototype.code.bind(marked.Renderer.prototype);
        const origLink = marked.Renderer.prototype.link.bind(marked.Renderer.prototype);
        marked.Renderer.prototype.code = function (token) {
          const lang = token.lang || '';
          const code = token.text || '';
          let html = origCode(token);
          const langLabel = lang ? `<div class="pc-code-header"><span class="pc-code-lang">${lang}</span><button class="pc-copy-btn" data-pc-code="${encodeURIComponent(code)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button></div>` : '';
          html = html.replace('<pre>', `<pre>${langLabel}`);
          return html;
        };
        marked.Renderer.prototype.link = function (token) {
          let html = origLink(token);
          return html.replace('<a ', '<a target="_blank" rel="noopener" ');
        };
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  function setStatus(text, state) {
    statusText.textContent = text;
    statusDot.className = '';
    if (state) statusDot.classList.add(state);
  }

  function updateModelBadge(model) {
    if (!model) return;
    const short = model.includes('/') ? model.split('/')[1] : model;
    modelBadge.textContent = short;
    welcomeModelName.textContent = model;
  }

  async function loadModels(apiKey) {
    modelField.style.display = 'block';
    noKeyMsg.style.display = 'none';
    modelsLoading.style.display = 'flex';

    try {
      const res = await chrome.runtime.sendMessage({ type: 'FETCH_MODELS', apiKey });
      modelsLoading.style.display = 'none';

      if (!res.success || !res.data || res.data.length === 0) {
        settingsStatus.textContent = 'No models found. Check your API key.';
        settingsStatus.className = 'pc-status-msg err';
        modelSelect.innerHTML = '<option value="">No models available</option>';
        return;
      }

      const grouped = {};
      res.data.forEach(m => {
        const provider = m.provider || 'other';
        if (!grouped[provider]) grouped[provider] = [];
        grouped[provider].push(m);
      });

      modelSelect.innerHTML = '';
      Object.keys(grouped).sort().forEach(provider => {
        const group = document.createElement('optgroup');
        group.label = provider.charAt(0).toUpperCase() + provider.slice(1);
        grouped[provider].forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = m.name || m.id;
          group.appendChild(opt);
        });
        modelSelect.appendChild(group);
      });

      if (currentModel) modelSelect.value = currentModel;
      modelsLoaded = true;
    } catch (e) {
      modelsLoading.style.display = 'none';
      settingsStatus.textContent = 'Failed to load models: ' + e.message;
      settingsStatus.className = 'pc-status-msg err';
    }
  }

  function showSettings() {
    settingsPanel.classList.add('show');
  }

  function hideSettings() {
    settingsPanel.classList.remove('show');
  }

  function openSidebar() {
    toggleBtn.style.display = 'none';
    loadMarked();
    refreshPageContent();
  }

  function closeSidebar() {
    toggleBtn.style.display = 'flex';
  }

  closeBtn.addEventListener('click', closeSidebar);
  settingsBtn.addEventListener('click', showSettings);

  toggleVisBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      settingsStatus.textContent = 'Please enter your API key';
      settingsStatus.className = 'pc-status-msg err';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    await chrome.storage.local.set({ [API_KEY_STORAGE]: apiKey });
    setStatus('Loading models...', 'loading');
    await loadModels(apiKey);
    await chrome.storage.local.set({ [MODEL_STORAGE]: modelSelect.value });
    currentModel = modelSelect.value;
    updateModelBadge(currentModel);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
    settingsStatus.textContent = 'Settings saved!';
    settingsStatus.className = 'pc-status-msg ok';
    setStatus('Ready', 'ready');

    setTimeout(() => {
      hideSettings();
      settingsStatus.textContent = '';
      settingsStatus.className = 'pc-status-msg';
    }, 800);
  });

  apiKeyInput.addEventListener('input', async () => {
    const val = apiKeyInput.value.trim();
    if (val.length > 10 && val.startsWith('sk-or')) {
      await chrome.storage.local.set({ [API_KEY_STORAGE]: val });
      setStatus('Loading models...', 'loading');
      await loadModels(val);
    }
  });

  async function init() {
    const stored = await chrome.storage.local.get([API_KEY_STORAGE, MODEL_STORAGE]);
    const storedKey = stored[API_KEY_STORAGE];
    const storedModel = stored[MODEL_STORAGE];

    if (storedKey) {
      apiKeyInput.value = storedKey;
      currentModel = storedModel || '';
      setStatus('Loading models...', 'loading');
      await loadModels(storedKey);
      if (currentModel && modelSelect.querySelector(`option[value="${currentModel}"]`)) {
        modelSelect.value = currentModel;
      }
      updateModelBadge(currentModel);
      setStatus('Ready', 'ready');
    } else {
      setStatus('API key not set', 'error');
      modelField.style.display = 'none';
      noKeyMsg.style.display = 'block';
    }
  }

  async function refreshPageContent() {
    try {
      pageContent = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTENT' });
    } catch (e) { pageContent = null; }
  }

  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    if (isProcessing) return;
    const text = userInput.value.trim();
    if (!text) return;

    const stored = await chrome.storage.local.get([API_KEY_STORAGE, MODEL_STORAGE]);
    const apiKey = stored[API_KEY_STORAGE];
    const model = stored[MODEL_STORAGE];

    if (!apiKey) {
      showSettings();
      setStatus('API key required', 'error');
      return;
    }
    if (!model && !stored[MODEL_STORAGE]) {
      setStatus('Select a model first', 'error');
      showSettings();
      return;
    }

    const selectedModel = model || stored[MODEL_STORAGE];
    isProcessing = true;
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    setStatus('Thinking...', 'loading');

    if (welcomeScreen) welcomeScreen.remove();

    appendMsg('user', text);
    chatMessages.push({ role: 'user', content: text });

    const typingId = appendTyping();

    try {
      await loadMarked();

      const systemMsg = {
        role: 'system',
        content: [
          'You are a helpful AI assistant. Answer questions about the web page content below.',
          '',
          `Page Title: ${pageContent?.title || 'Unknown'}`,
          `Page URL: ${pageContent?.url || 'Unknown'}`,
          '',
          '--- PAGE CONTENT ---',
          pageContent?.content || 'No page content available.',
          '--- END PAGE CONTENT ---',
          '',
          'Answer based on the page content above. Use Markdown formatting (headers, lists, code blocks, tables) to make responses clear and well-organized. Be helpful and thorough.'
        ].join('\n')
      };

      const response = await chrome.runtime.sendMessage({
        type: 'CHAT',
        apiKey,
        model: selectedModel,
        messages: [systemMsg, ...chatMessages]
      });

      removeTyping(typingId);

      if (response.success) {
        const aiText = response.data.choices?.[0]?.message?.content || 'No response';
        chatMessages.push({ role: 'assistant', content: aiText });
        appendMsg('ai', aiText);
        setStatus('Ready', 'ready');
      } else {
        const err = response.error || 'Unknown error';
        chatMessages.push({ role: 'assistant', content: `Error: ${err}` });
        appendMsg('ai', `Error: ${err}`, true);
        setStatus('Error', 'error');
      }
    } catch (e) {
      removeTyping(typingId);
      chatMessages.push({ role: 'assistant', content: `Error: ${e.message}` });
      appendMsg('ai', `Error: ${e.message}`, true);
      setStatus('Error', 'error');
    }

    isProcessing = false;
    sendBtn.disabled = false;
    chatArea.scrollTop = chatArea.scrollHeight;
    userInput.focus();
  }

  function appendMsg(role, content, isError = false) {
    const row = document.createElement('div');
    row.className = `pc-msg-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = `pc-avatar ${role}`;
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const body = document.createElement('div');
    body.className = 'pc-msg-body';

    const bubble = document.createElement('div');
    bubble.className = `pc-msg-bubble ${role === 'ai' ? (isError ? 'error' : '') : ''}`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'pc-msg-role';
    roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';

    const msgContent = document.createElement('div');
    if (role === 'ai') {
      msgContent.innerHTML = marked.parse(content || '');
    } else {
      msgContent.textContent = content;
    }

    bubble.appendChild(roleLabel);
    bubble.appendChild(msgContent);
    body.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(body);
    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function appendTyping() {
    const row = document.createElement('div');
    row.className = 'pc-typing-row';

    const avatar = document.createElement('div');
    avatar.className = 'pc-avatar ai';
    avatar.textContent = 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'pc-msg-bubble ai';

    const dots = document.createElement('div');
    dots.className = 'pc-typing-dots';
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('span');
      dots.appendChild(s);
    }

    bubble.appendChild(dots);
    row.appendChild(avatar);
    row.appendChild(bubble);
    row.id = 'pc-typing-' + Date.now();
    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;
    return row.id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  document.addEventListener('click', (e) => {
    const quickBtn = e.target.closest('.pc-quick-btn');
    if (quickBtn) {
      const prompt = quickBtn.dataset.pcPrompt;
      if (prompt) {
        userInput.value = prompt;
        userInput.dispatchEvent(new Event('input'));
        sendMessage();
      }
    }

    const copyBtn = e.target.closest('.pc-copy-btn');
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.dataset.pcCode);
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        }, 2000);
      });
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE_SIDEBAR') {
      if (toggleBtn.style.display === 'none') {
        closeSidebar();
      } else {
        openSidebar();
      }
      sendResponse({ success: true });
    }
    return true;
  });

  init();
  refreshPageContent();
})();