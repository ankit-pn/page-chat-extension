(function () {
  'use strict';

  if (document.getElementById('pc-root')) return;

  const MARKED_SRC = chrome.runtime.getURL('lib/marked.min.js');

  const CSS = `
#pc-root,#pc-root *,#pc-root *::before,#pc-root *::after{all:initial;box-sizing:border-box}
#pc-root{
  --bg: #0a0a0f;
  --bg-card: #13141f;
  --bg-input: #1a1b2e;
  --bg-hover: #1e2038;
  --border: #1f2140;
  --border-focus: #4f46e5;
  --text: #e8e9f3;
  --text-dim: #9090b5;
  --text-subtle: #595980;
  --accent: #6366f1;
  --accent-glow: rgba(99,102,241,0.25);
  --green: #10b981;
  --red: #ef4444;
  --orange: #f59e0b;
  --radius: 12px;
  --radius-sm: 8px;
  position:fixed;top:0;right:0;bottom:0;z-index:2147483647;
  font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
  direction:ltr;
  display:flex;flex-direction:column;
  width:420px;height:100%;
  background:var(--bg);
  border-left:1px solid var(--border);
  box-shadow:-8px 0 40px rgba(0,0,0,0.6);
}

/* Toggle tab on page edge */
#pc-tab{
  position:fixed;right:0;top:40%;z-index:2147483646;
  width:30px;height:100px;
  background:var(--bg-card);border:1px solid var(--border);
  border-right:none;border-radius:10px 0 0 10px;
  cursor:pointer;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:6px;
  color:var(--text-dim);transition:all 0.2s;
  writing-mode:vertical-lr;letter-spacing:2px;
  font-size:11px;font-weight:500;padding:8px 0;
}
#pc-tab:hover{background:var(--bg-hover);color:var(--accent);border-color:var(--accent)}
#pc-tab svg{width:16px;height:16px}

/* Header */
#pc-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;background:var(--bg-card);
  border-bottom:1px solid var(--border);
  height:56px;flex-shrink:0;
}
#pc-hdr-l{display:flex;align-items:center;gap:10px}
#pc-hdr-icon{
  width:30px;height:30px;border-radius:8px;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 12px rgba(99,102,241,0.4);
}
#pc-hdr-icon svg{width:16px;height:16px;color:#fff}
#pc-hdr-title{font-size:15px;font-weight:600;color:var(--text)}
#pc-hdr-model{
  font-size:11px;color:var(--text-dim);font-weight:400;
  max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
}
#pc-hdr-r{display:flex;align-items:center;gap:4px}
.pc-btn{
  width:34px;height:34px;border:none;background:none;
  color:var(--text-dim);cursor:pointer;border-radius:8px;
  display:flex;align-items:center;justify-content:center;transition:all 0.15s
}
.pc-btn:hover{background:var(--bg-hover);color:var(--text)}
.pc-btn svg{width:18px;height:18px}
.pc-btn.active{background:var(--accent-glow);color:var(--accent)}

/* Page context bar */
#pc-ctx{
  display:flex;align-items:center;gap:8px;
  padding:8px 18px;background:var(--bg-card);
  border-bottom:1px solid var(--border);
  font-size:11px;color:var(--text-dim);flex-shrink:0
}
#pc-ctx-dot{width:5px;height:5px;border-radius:50%;background:var(--green);flex-shrink:0}
#pc-ctx-dot.err{background:var(--red)}
#pc-ctx-dot.load{background:var(--orange);animation:pc-pulse 1s infinite}
@keyframes pc-pulse{0%,100%{opacity:1}50%{opacity:0.3}}
#pc-ctx-txt{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Views container */
#pc-views{flex:1;overflow:hidden;position:relative}

/* Setup view */
#pc-setup{
  display:flex;flex-direction:column;position:absolute;inset:0;
  padding:32px 24px;overflow-y:auto;gap:24px
}
#pc-setup.hidden{display:none}
.pc-setup-head{text-align:center}
.pc-setup-head h1{font-size:20px;font-weight:700;color:var(--text);margin:0 0 8px}
.pc-setup-head p{font-size:13px;color:var(--text-dim);margin:0;line-height:1.6}
.pc-setup-icon{
  width:56px;height:56px;border-radius:16px;
  background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2));
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 12px
}
.pc-setup-icon svg{width:28px;height:28px;color:var(--accent)}
.pc-field{position:relative}
.pc-field-lbl{
  display:block;font-size:11px;font-weight:600;color:var(--text);
  margin-bottom:8px;text-transform:uppercase;letter-spacing:1px
}
.pc-field-inp{
  width:100%;padding:12px 16px;background:var(--bg-input);
  border:2px solid var(--border);border-radius:var(--radius-sm);
  color:var(--text);font-size:14px;font-family:inherit;
  outline:none;transition:border-color 0.2s,box-shadow 0.2s
}
.pc-field-inp:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow)}
.pc-field-inp::placeholder{color:var(--text-subtle)}
.pc-field-hint{
  display:flex;align-items:center;gap:6px;margin-top:6px;
  font-size:11px;color:var(--text-dim)
}
.pc-field-hint a{color:var(--accent);text-decoration:none}
.pc-field-hint a:hover{text-decoration:underline}
.pc-field select{
  width:100%;padding:12px 16px;background:var(--bg-input);
  border:2px solid var(--border);border-radius:var(--radius-sm);
  color:var(--text);font-size:14px;font-family:inherit;
  outline:none;cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239090b5' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 16px center;
  padding-right:40px;transition:border-color 0.2s
}
.pc-field select:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow)}
.pc-field-inp-eye{
  width:100%;padding:12px 48px 12px 16px;background:var(--bg-input);
  border:2px solid var(--border);border-radius:var(--radius-sm);
  color:var(--text);font-size:14px;font-family:inherit;
  outline:none;transition:border-color 0.2s,box-shadow 0.2s
}
.pc-field-inp-eye:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow)}
.pc-field-eye{
  position:absolute;right:4px;bottom:4px;
  width:36px;height:36px;display:flex;align-items:center;justify-content:center;
  background:none;border:none;color:var(--text-subtle);cursor:pointer;
  border-radius:6px;transition:all 0.15s
}
.pc-field-eye:hover{color:var(--text);background:var(--bg-hover)}
.pc-btn-primary{
  width:100%;padding:14px 24px;background:var(--accent);color:white;
  border:none;border-radius:var(--radius-sm);font-size:14px;
  font-weight:600;cursor:pointer;transition:all 0.2s;font-family:inherit;
  box-shadow:0 4px 16px rgba(99,102,241,0.3);
  display:flex;align-items:center;justify-content:center;gap:8px
}
.pc-btn-primary:hover:not(:disabled){
  background:#5558e6;box-shadow:0 6px 20px rgba(99,102,241,0.4);transform:translateY(-1px)
}
.pc-btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.pc-spin{width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:pc-rotate 0.6s linear infinite}
@keyframes pc-rotate{to{transform:rotate(360deg)}}
.pc-msg-error{
  padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
  border-radius:var(--radius-sm);color:var(--red);font-size:12px;line-height:1.5
}
.pc-msg-success{
  padding:12px 16px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);
  border-radius:var(--radius-sm);color:var(--green);font-size:12px
}

/* Chat view */
#pc-chat{
  display:flex;flex-direction:column;position:absolute;inset:0
}
#pc-chat.hidden{display:none}
#pc-msgs{
  flex:1;overflow-y:auto;padding:20px 18px;
  display:flex;flex-direction:column;gap:20px
}
#pc-msgs::-webkit-scrollbar{width:5px}
#pc-msgs::-webkit-scrollbar-track{background:transparent}
#pc-msgs::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* Welcome */
.pc-welcome{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;padding:40px 20px;
  flex:1;gap:12px
}
.pc-welcome h2{font-size:18px;font-weight:600;color:var(--text);margin:0}
.pc-welcome p{font-size:13px;color:var(--text-dim);margin:0;max-width:300px;line-height:1.5}
.pc-chip-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px}
.pc-chip{
  padding:9px 18px;background:var(--bg-card);border:1px solid var(--border);
  border-radius:24px;color:var(--text-dim);font-size:13px;
  cursor:pointer;transition:all 0.15s;font-family:inherit
}
.pc-chip:hover{background:var(--accent-glow);color:var(--accent);border-color:var(--accent)}

/* Messages */
.pc-msg-row{display:flex;gap:12px;align-items:flex-start;animation:pc-fade 0.2s ease}
.pc-msg-row.user{flex-direction:row-reverse}
@keyframes pc-fade{from{opacity:0;translate:0 6px}to{opacity:1;translate:0 0}}
.pc-avatar{
  width:30px;height:30px;border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:700
}
.pc-avatar.ai{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white}
.pc-avatar.user{background:var(--bg-hover);color:var(--text-dim)}
.pc-msg-wrap{max-width:85%}
.pc-msg{
  padding:13px 16px;border-radius:var(--radius);
  font-size:13.5px;line-height:1.65;word-wrap:break-word
}
.pc-msg.user{background:var(--bg-input);border:1px solid var(--border);border-bottom-right-radius:4px;color:var(--text)}
.pc-msg.assistant{background:var(--bg-card);border:1px solid var(--border);border-bottom-left-radius:4px;color:var(--text)}
.pc-msg.error{border-color:var(--red);background:rgba(239,68,68,0.05)}
.pc-msg-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.pc-msg.assistant .pc-msg-label{color:var(--accent)}
.pc-msg.user .pc-msg-label{color:var(--text-subtle)}

/* Markdown */
.pc-msg h1,.pc-msg h2,.pc-msg h3,.pc-msg h4{margin:12px 0 6px;color:var(--text);line-height:1.4}
.pc-msg h1{font-size:17px;border-bottom:1px solid var(--border);padding-bottom:6px}
.pc-msg h2{font-size:15px}.pc-msg h3{font-size:14px}.pc-msg h4{font-size:13px}
.pc-msg p{margin:6px 0}.pc-msg p:first-child{margin-top:0}.pc-msg p:last-child{margin-bottom:0}
.pc-msg ul,.pc-msg ol{margin:6px 0;padding-left:22px}
.pc-msg li{margin:3px 0}
.pc-msg code{
  background:var(--bg-input);padding:2px 7px;border-radius:5px;
  font-size:12px;font-family:'SF Mono','Cascadia Code',Menlo,monospace;color:#c4b5fd
}
.pc-msg pre{
  background:#0d0d1a;border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:32px 14px 14px;
  margin:10px 0;overflow-x:auto;position:relative
}
.pc-msg pre code{background:none;padding:0;color:var(--text);font-size:12.5px}
.pc-code-bar{
  position:absolute;top:0;left:0;right:0;height:28px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 12px;font-size:11px;color:var(--text-subtle);
  background:rgba(255,255,255,0.02)
}
.pc-copy{
  display:flex;align-items:center;gap:4px;padding:2px 8px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:4px;color:var(--text-subtle);font-size:10px;
  cursor:pointer;font-family:inherit;transition:all 0.15s
}
.pc-copy:hover{background:rgba(255,255,255,0.08);color:var(--text)}
.pc-msg blockquote{
  border-left:3px solid var(--accent);margin:8px 0;padding:8px 14px;
  background:var(--accent-glow);border-radius:0 var(--radius-sm) var(--radius-sm) 0
}
.pc-msg a{color:var(--accent);text-decoration:none}.pc-msg a:hover{text-decoration:underline}
.pc-msg table{border-collapse:collapse;width:100%;margin:8px 0;font-size:12.5px}
.pc-msg th,.pc-msg td{border:1px solid var(--border);padding:8px 12px;text-align:left}
.pc-msg th{background:var(--bg-input);font-weight:600}
.pc-msg hr{border:none;border-top:1px solid var(--border);margin:14px 0}
.pc-msg strong{font-weight:600;color:#fff}
.pc-msg em{font-style:italic}

/* Typing */
.pc-typing{display:flex;gap:5px;padding:8px 0}
.pc-typing span{
  width:7px;height:7px;background:var(--text-subtle);border-radius:50%;
  animation:pc-bounce 1.2s infinite
}
.pc-typing span:nth-child(2){animation-delay:0.15s}
.pc-typing span:nth-child(3){animation-delay:0.3s}
@keyframes pc-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}

/* Input */
#pc-inp-area{padding:14px 18px;background:var(--bg-card);border-top:1px solid var(--border);flex-shrink:0}
#pc-inp-wrap{
  display:flex;gap:8px;align-items:flex-end;
  background:var(--bg-input);border:2px solid var(--border);
  border-radius:var(--radius);padding:6px;transition:border-color 0.2s,box-shadow 0.2s
}
#pc-inp-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow)}
#pc-inp{
  flex:1;resize:none;background:none;border:none;outline:none;
  padding:8px 10px;color:var(--text);font-size:13.5px;
  font-family:inherit;line-height:1.5;max-height:120px
}
#pc-inp::placeholder{color:var(--text-subtle)}
#pc-send{
  width:40px;height:40px;border-radius:10px;border:none;
  background:var(--accent);color:white;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all 0.15s;
  box-shadow:0 2px 12px rgba(99,102,241,0.4)
}
#pc-send:hover:not(:disabled){background:#5558e6;box-shadow:0 4px 16px rgba(99,102,241,0.5)}
#pc-send:disabled{background:var(--bg-hover);color:var(--text-subtle);box-shadow:none;cursor:not-allowed}
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── DOM ──────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'pc-root';
  root.innerHTML = `
    <div id="pc-hdr">
      <div id="pc-hdr-l">
        <div id="pc-hdr-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <div id="pc-hdr-title">PageChat AI</div>
          <div id="pc-hdr-model"></div>
        </div>
      </div>
      <div id="pc-hdr-r">
        <button id="pc-btn-settings" class="pc-btn" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
        <button id="pc-btn-close" class="pc-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <div id="pc-ctx">
      <div id="pc-ctx-dot" class="load"></div>
      <span id="pc-ctx-txt">Reading page...</span>
    </div>

    <div id="pc-views">
      <div id="pc-chat" class="hidden">
        <div id="pc-msgs">
          <div class="pc-welcome" id="pc-welcome">
            <h2>Ask about this page</h2>
            <p>Ask questions, get summaries, extract insights - all based on the page content.</p>
            <div class="pc-chip-row">
              <button class="pc-chip" data-pc-prompt="Summarize this page in 3-5 bullet points">Summarize</button>
              <button class="pc-chip" data-pc-prompt="What are the key points of this page?">Key Points</button>
              <button class="pc-chip" data-pc-prompt="Explain this page like I'm 10 years old">ELI5</button>
            </div>
          </div>
        </div>
        <div id="pc-inp-area">
          <div id="pc-inp-wrap">
            <textarea id="pc-inp" placeholder="Ask about this page..." rows="1"></textarea>
            <button id="pc-send" title="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div id="pc-setup">
        <div class="pc-setup-head">
          <div class="pc-setup-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1>Setup</h1>
          <p>Enter your OpenRouter API key to start chatting with any webpage.</p>
        </div>

        <div id="pc-setup-err" class="pc-msg-error" style="display:none"></div>

        <div class="pc-field">
          <label class="pc-field-lbl">OpenRouter API Key</label>
          <div class="pc-field" style="margin:0">
            <input type="password" id="pc-key" class="pc-field-inp-eye" placeholder="sk-or-v1-...">
            <button id="pc-eye" class="pc-field-eye" title="Show key">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="pc-field-hint">
            Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys &nearr;</a>
          </div>
        </div>

        <div class="pc-field" id="pc-model-wrap" style="display:none">
          <label class="pc-field-lbl">Model</label>
          <select id="pc-model">
            <option value="">Loading models...</option>
          </select>
          <div id="pc-model-spin" class="pc-field-hint" style="display:none">
            <div class="pc-spin" style="border-color:var(--text-subtle);border-top-color:var(--accent)"></div>
            Fetching available models...
          </div>
        </div>

        <button id="pc-save" class="pc-btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          Save and Continue
        </button>

        <div id="pc-saved" class="pc-msg-success" style="display:none">Settings saved! Loading chat...</div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Toggle tab
  const tab = document.createElement('div');
  tab.id = 'pc-tab';
  tab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Chat`;
  tab.addEventListener('click', () => { tab.style.display = 'none'; loadMarked(); refreshCtx(); });
  document.body.appendChild(tab);

  // ── Refs ────────────────────────────────────────────
  const R = {
    setup: document.getElementById('pc-setup'),
    chat: document.getElementById('pc-chat'),
    msgs: document.getElementById('pc-msgs'),
    welcome: document.getElementById('pc-welcome'),
    inp: document.getElementById('pc-inp'),
    send: document.getElementById('pc-send'),
    key: document.getElementById('pc-key'),
    model: document.getElementById('pc-model'),
    modelWrap: document.getElementById('pc-model-wrap'),
    modelSpin: document.getElementById('pc-model-spin'),
    save: document.getElementById('pc-save'),
    setupErr: document.getElementById('pc-setup-err'),
    saved: document.getElementById('pc-saved'),
    eye: document.getElementById('pc-eye'),
    btnSettings: document.getElementById('pc-btn-settings'),
    btnClose: document.getElementById('pc-btn-close'),
    hdrModel: document.getElementById('pc-hdr-model'),
    ctxDot: document.getElementById('pc-ctx-dot'),
    ctxTxt: document.getElementById('pc-ctx-txt'),
  };

  // ── State ───────────────────────────────────────────
  let pageContent = null;
  let chatMsg  = [];
  let isBusy   = false;
  let hasMarked = false;
  let modelList = [];

  // ── Marked ──────────────────────────────────────────
  function loadMarked() {
    return new Promise(res => {
      if (hasMarked) return res();
      const s = document.createElement('script');
      s.src = MARKED_SRC;
      s.onload = () => {
        hasMarked = true;
        marked.setOptions({ breaks: true, gfm: true });
        const origRender = marked.Renderer.prototype;
        const origCode = origRender.code.bind(origRender);
        const origLink = origRender.link.bind(origRender);
        origRender.code = function (token) {
          const lang = token.lang || '';
          const code = token.text || '';
          let html = origCode(token);
          const bar = lang
            ? `<div class="pc-code-bar"><span>${lang}</span><button class="pc-copy" data-pc-code="${encodeURIComponent(code)}">Copy</button></div>`
            : `<div class="pc-code-bar"><span></span><button class="pc-copy" data-pc-code="${encodeURIComponent(code)}">Copy</button></div>`;
          html = html.replace('<pre>', `<pre>${bar}`);
          return html;
        };
        origRender.link = function (token) {
          return origLink(token).replace('<a ', '<a target="_blank" rel="noopener" ');
        };
        res();
      };
      document.head.appendChild(s);
    });
  }

  // ── View switching ──────────────────────────────────
  function showSetup() {
    R.chat.classList.add('hidden');
    R.setup.classList.remove('hidden');
    R.btnSettings.classList.add('active');
  }
  function showChat() {
    R.setup.classList.add('hidden');
    R.chat.classList.remove('hidden');
    R.btnSettings.classList.remove('active');
  }

  // ── Context ─────────────────────────────────────────
  async function refreshCtx() {
    R.ctxDot.className = 'load';
    R.ctxTxt.textContent = 'Reading page...';
    try {
      pageContent = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTENT' });
      R.ctxDot.className = '';
      R.ctxTxt.textContent = pageContent?.title || 'Ready';
    } catch (e) {
      R.ctxDot.className = 'err';
      R.ctxTxt.textContent = 'Could not read page content';
      pageContent = null;
    }
  }

  // ── Model loading ───────────────────────────────────
  async function fetchModels(apiKey) {
    R.modelWrap.style.display = 'block';
    R.modelSpin.style.display = 'flex';
    try {
      const res = await chrome.runtime.sendMessage({ type: 'FETCH_MODELS', apiKey });
      R.modelSpin.style.display = 'none';
      if (!res.success || !res.data || !res.data.length) {
        R.model.innerHTML = '<option value="">No models found</option>';
        return;
      }
      modelList = res.data;
      const groups = {};
      modelList.forEach(m => {
        const p = m.provider || 'other';
        (groups[p] = groups[p] || []).push(m);
      });
      R.model.innerHTML = '';
      Object.keys(groups).sort().forEach(p => {
        const g = document.createElement('optgroup');
        g.label = p.charAt(0).toUpperCase() + p.slice(1);
        groups[p].forEach(m => {
          const o = document.createElement('option');
          o.value = m.id;
          o.textContent = m.name || m.id;
          g.appendChild(o);
        });
        R.model.appendChild(g);
      });
      const stored = await chrome.storage.local.get(['pc_model']);
      if (stored.pc_model && R.model.querySelector(`option[value="${stored.pc_model}"]`)) {
        R.model.value = stored.pc_model;
      }
    } catch (e) {
      R.modelSpin.style.display = 'none';
      R.model.innerHTML = '<option value="">Failed to load</option>';
    }
  }

  // ── Init ────────────────────────────────────────────
  async function init() {
    const { pc_api_key, pc_model } = await chrome.storage.local.get(['pc_api_key', 'pc_model']);
    if (pc_api_key) {
      R.key.value = pc_api_key;
      await fetchModels(pc_api_key);
      const short = pc_model ? (pc_model.includes('/') ? pc_model.split('/').slice(1).join('/') : pc_model) : '';
      R.hdrModel.textContent = short || 'No model selected';
      showChat();
    } else {
      showSetup();
    }
    refreshCtx();
  }

  R.eye.addEventListener('click', () => { R.key.type = R.key.type === 'password' ? 'text' : 'password'; });
  R.btnSettings.addEventListener('click', showSetup);
  R.btnClose.addEventListener('click', () => { tab.style.display = 'flex'; });

  // ── Save settings ───────────────────────────────────
  R.save.addEventListener('click', async () => {
    const key = R.key.value.trim();
    if (!key) {
      R.setupErr.style.display = 'block';
      R.setupErr.textContent = 'Please enter your OpenRouter API key.';
      return;
    }
    R.setupErr.style.display = 'none';
    R.save.disabled = true;
    R.save.innerHTML = '<div class="pc-spin"></div> Saving...';
    await chrome.storage.local.set({ pc_api_key: key });

    R.modelWrap.style.display = 'block';
    await fetchModels(key);

    const model = R.model.value;
    await chrome.storage.local.set({ pc_model: model });
    const short = model ? (model.includes('/') ? model.split('/').slice(1).join('/') : model) : '';
    R.hdrModel.textContent = short || 'Model saved';

    R.save.disabled = false;
    R.save.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save and Continue';

    R.saved.style.display = 'block';
    setTimeout(() => {
      R.saved.style.display = 'none';
      showChat();
    }, 800);
  });

  // ── Chat input ──────────────────────────────────────
  R.inp.addEventListener('input', () => {
    R.inp.style.height = 'auto';
    R.inp.style.height = Math.min(R.inp.scrollHeight, 120) + 'px';
  });
  R.inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });
  R.send.addEventListener('click', doSend);

  // ── Send message ────────────────────────────────────
  async function doSend() {
    if (isBusy) return;
    const text = R.inp.value.trim();
    if (!text) return;

    const { pc_api_key: apiKey, pc_model: model } = await chrome.storage.local.get(['pc_api_key', 'pc_model']);
    if (!apiKey || !model) { showSetup(); return; }

    isBusy = true;
    R.inp.value = '';
    R.inp.style.height = 'auto';
    R.send.disabled = true;
    R.ctxDot.className = 'load';
    R.ctxTxt.textContent = 'Thinking...';

    if (R.welcome) R.welcome.remove();
    addMsg('user', text);
    chatMsg.push({ role: 'user', content: text });
    const tid = addTyping();

    try {
      await loadMarked();
      const sys = {
        role: 'system',
        content: [
          'You are a helpful AI assistant. Answer questions about this web page using the content below:',
          `\nPage: ${pageContent?.title || 'Unknown'} (${pageContent?.url || ''})`,
          '\n--- PAGE CONTENT ---\n',
          pageContent?.content || 'No content available.',
          '\n--- END ---\n',
          'Format responses with Markdown (headers, lists, code blocks, tables). Be thorough and helpful.'
        ].join('\n')
      };
      const resp = await chrome.runtime.sendMessage({ type: 'CHAT', apiKey, model, messages: [sys, ...chatMsg] });
      remTyping(tid);
      if (resp.success) {
        const aiText = resp.data.choices?.[0]?.message?.content || 'No response';
        chatMsg.push({ role: 'assistant', content: aiText });
        addMsg('assistant', aiText);
        R.ctxDot.className = '';
        R.ctxTxt.textContent = 'Ready';
      } else {
        const err = resp.error || 'Error';
        chatMsg.push({ role: 'assistant', content: `Error: ${err}` });
        addMsg('assistant', `Error: ${err}`, true);
        R.ctxDot.className = 'err';
        R.ctxTxt.textContent = 'Error';
      }
    } catch (e) {
      remTyping(tid);
      chatMsg.push({ role: 'assistant', content: `Error: ${e.message}` });
      addMsg('assistant', `Error: ${e.message}`, true);
      R.ctxDot.className = 'err';
      R.ctxTxt.textContent = 'Error';
    }
    isBusy = false;
    R.send.disabled = false;
    R.msgs.scrollTop = R.msgs.scrollHeight;
    R.inp.focus();
  }

  function addMsg(role, content, isErr) {
    const row = document.createElement('div');
    row.className = `pc-msg-row ${role === 'user' ? 'user' : ''}`;
    const avatar = document.createElement('div');
    avatar.className = `pc-avatar ${role === 'user' ? 'user' : 'ai'}`;
    avatar.textContent = role === 'user' ? 'Y' : 'AI';
    const wrap = document.createElement('div');
    wrap.className = 'pc-msg-wrap';
    const msg = document.createElement('div');
    msg.className = `pc-msg ${role === 'user' ? 'user' : 'assistant'}${isErr ? ' error' : ''}`;
    const label = document.createElement('div');
    label.className = 'pc-msg-label';
    label.textContent = role === 'user' ? 'You' : isErr ? 'Error' : 'Assistant';
    const body = document.createElement('div');
    if (role === 'assistant') body.innerHTML = marked.parse(content);
    else body.textContent = content;
    msg.appendChild(label);
    msg.appendChild(body);
    wrap.appendChild(msg);
    row.appendChild(avatar);
    row.appendChild(wrap);
    R.msgs.appendChild(row);
    R.msgs.scrollTop = R.msgs.scrollHeight;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'pc-msg-row';
    const avatar = document.createElement('div');
    avatar.className = 'pc-avatar ai';
    avatar.textContent = 'AI';
    const wrap = document.createElement('div');
    wrap.className = 'pc-msg-wrap';
    const msg = document.createElement('div');
    msg.className = 'pc-msg assistant';
    const dots = document.createElement('div');
    dots.className = 'pc-typing';
    dots.innerHTML = '<span></span><span></span><span></span>';
    msg.appendChild(dots);
    wrap.appendChild(msg);
    row.appendChild(avatar);
    row.appendChild(wrap);
    row.id = `pc-ty-${Date.now()}`;
    R.msgs.appendChild(row);
    R.msgs.scrollTop = R.msgs.scrollHeight;
    return row.id;
  }

  function remTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }

  // ── Global clicks ───────────────────────────────────
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.pc-chip');
    if (chip && chip.dataset.pcPrompt) {
      R.inp.value = chip.dataset.pcPrompt;
      R.inp.dispatchEvent(new Event('input'));
      doSend();
    }
    const copy = e.target.closest('.pc-copy');
    if (copy && copy.dataset.pcCode) {
      navigator.clipboard.writeText(decodeURIComponent(copy.dataset.pcCode)).then(() => {
        copy.textContent = 'Copied!';
        setTimeout(() => { copy.textContent = 'Copy'; }, 2000);
      });
    }
  });

  // ── Extension messages ──────────────────────────────
  chrome.runtime.onMessage.addListener((msg, s, send) => {
    if (msg.type === 'TOGGLE_SIDEBAR') {
      tab.style.display = tab.style.display === 'none' ? 'flex' : 'none';
      send({ success: true });
    }
    return true;
  });

  init();
})();