(function () {
  'use strict';

  if (document.getElementById('pc-sidebar-root')) return;

  const MARKED_SRC = chrome.runtime.getURL('lib/marked.min.js');

  const CSS = `
#pc-sidebar-root, #pc-sidebar-root *, #pc-sidebar-root *::before, #pc-sidebar-root *::after {
  all: initial;
  box-sizing: border-box;
}
#pc-sidebar-root {
  --pc-bg: #0f1117;
  --pc-bg2: #1a1d27;
  --pc-bg3: #242836;
  --pc-border: #2a2e3a;
  --pc-text: #e4e6eb;
  --pc-text2: #8b8fa3;
  --pc-text3: #5c6072;
  --pc-accent: #6366f1;
  --pc-accent-h: #818cf8;
  --pc-accent-l: rgba(99,102,241,0.15);
  --pc-danger: #ef4444;
  --pc-success: #22c55e;
  --pc-radius: 10px;
  --pc-radius-sm: 6px;
  position: fixed;
  top: 0; right: 0; bottom: 0; z-index: 2147483647;
  font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  direction: ltr;
}
#pc-toggle-tab {
  position: fixed;
  right: 0; top: 50%;
  transform: translateY(-50%);
  z-index: 2147483646;
  width: 32px; height: 80px;
  background: var(--pc-bg2);
  border: 1px solid var(--pc-border);
  border-right: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  color: var(--pc-text2);
  transition: all 0.2s ease;
  writing-mode: vertical-rl;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
}
#pc-toggle-tab:hover {
  background: var(--pc-bg3);
  color: var(--pc-accent-h);
}
#pc-sidebar {
  display: none;
  flex-direction: column;
  width: 420px; height: 100%;
  background: var(--pc-bg);
  border-left: 1px solid var(--pc-border);
  box-shadow: -4px 0 24px rgba(0,0,0,0.4);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
#pc-sidebar.open { display: flex; }
#pc-sidebar-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--pc-border);
  background: var(--pc-bg2); flex-shrink: 0;
}
#pc-sidebar-logo {
  font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, var(--pc-accent), #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
#pc-sidebar-close {
  background: none; border: none; cursor: pointer;
  color: var(--pc-text2); padding: 4px; display: flex;
  border-radius: 4px; transition: background 0.2s;
}
#pc-sidebar-close:hover { background: var(--pc-bg3); color: var(--pc-text); }
#pc-sidebar-body {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}
#pc-page-info {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--pc-bg2);
  border-bottom: 1px solid var(--pc-border); flex-shrink: 0;
}
#pc-page-info-icon { color: var(--pc-accent); flex-shrink: 0; display: flex; }
#pc-page-title {
  font-size: 12px; color: var(--pc-text2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
#pc-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
#pc-messages::-webkit-scrollbar { width: 4px; }
#pc-messages::-webkit-scrollbar-track { background: transparent; }
#pc-messages::-webkit-scrollbar-thumb { background: var(--pc-border); border-radius: 2px; }
#pc-input-area {
  border-top: 1px solid var(--pc-border); padding: 12px 16px;
  background: var(--pc-bg2); flex-shrink: 0;
}
#pc-input-row { display: flex; gap: 8px; align-items: flex-end; }
#pc-user-input {
  flex: 1; resize: none; padding: 10px 14px;
  background: var(--pc-bg3); border: 1px solid var(--pc-border);
  border-radius: 14px; color: var(--pc-text); font-size: 13px;
  font-family: inherit; line-height: 1.4; outline: none;
  max-height: 120px; transition: border-color 0.2s;
}
#pc-user-input:focus { border-color: var(--pc-accent); }
#pc-user-input::placeholder { color: var(--pc-text3); }
#pc-send-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--pc-accent); border: none; cursor: pointer;
  color: white; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
#pc-send-btn:hover { background: var(--pc-accent-h); transform: scale(1.05); }
#pc-send-btn:disabled { background: var(--pc-bg3); color: var(--pc-text3); cursor: not-allowed; transform: none; }
#pc-char-count { display: block; text-align: right; font-size: 10px; color: var(--pc-text3); padding-top: 4px; }
#pc-loading-overlay {
  position: absolute; inset: 0;
  background: rgba(15,17,23,0.85);
  display: none; align-items: center; justify-content: center; z-index: 100;
}
#pc-loading-overlay.visible { display: flex; }
.pc-spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--pc-border);
  border-top-color: var(--pc-accent); border-radius: 50%;
  animation: pc-spin 0.7s linear infinite;
}
@keyframes pc-spin { to { transform: rotate(360deg); } }
.pc-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 30px 20px; gap: 8px; }
.pc-welcome h2 { font-size: 16px; font-weight: 600; color: var(--pc-text); margin: 0; }
.pc-welcome p { font-size: 12px; color: var(--pc-text2); margin: 0 0 8px; }
.pc-quick-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.pc-quick-btn {
  padding: 6px 14px; background: var(--pc-bg3);
  border: 1px solid var(--pc-border); border-radius: 20px;
  color: var(--pc-text2); font-size: 11px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.pc-quick-btn:hover { background: var(--pc-accent-l); color: var(--pc-accent-h); border-color: var(--pc-accent); }
.pc-msg-wrap {
  display: flex; gap: 8px; align-items: flex-start;
  animation: pc-fadeIn 0.2s ease;
}
.pc-msg-wrap.pc-user { flex-direction: row-reverse; }
@keyframes pc-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.pc-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--pc-bg3); flex-shrink: 0;
  font-size: 11px; font-weight: 600; color: var(--pc-text2);
}
.pc-msg {
  max-width: 88%; padding: 10px 14px; border-radius: var(--pc-radius);
  font-size: 13px; line-height: 1.6; word-wrap: break-word;
}
.pc-msg.pc-user {
  background: #2d3250; border-bottom-right-radius: 4px; color: var(--pc-text);
}
.pc-msg.pc-ai {
  background: var(--pc-bg2); border: 1px solid var(--pc-border);
  border-bottom-left-radius: 4px; color: var(--pc-text);
}
.pc-msg.pc-ai.pc-error { border-color: var(--pc-danger); background: rgba(239,68,68,0.08); }
.pc-role-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.pc-msg.pc-ai .pc-role-label { color: var(--pc-accent); }
.pc-msg.pc-user .pc-role-label { color: var(--pc-text3); }

.pc-msg-body h1, .pc-msg-body h2, .pc-msg-body h3, .pc-msg-body h4 {
  margin: 12px 0 6px; color: var(--pc-text); line-height: 1.3;
}
.pc-msg-body h1 { font-size: 18px; border-bottom: 1px solid var(--pc-border); padding-bottom: 4px; }
.pc-msg-body h2 { font-size: 15px; }
.pc-msg-body h3 { font-size: 14px; }
.pc-msg-body h4 { font-size: 13px; }
.pc-msg-body p { margin: 4px 0; color: var(--pc-text); }
.pc-msg-body ul, .pc-msg-body ol { margin: 6px 0; padding-left: 20px; color: var(--pc-text); }
.pc-msg-body li { margin: 2px 0; color: var(--pc-text); }
.pc-msg-body code { background: var(--pc-bg3); padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'SF Mono','Fira Code',Menlo,monospace; color: #e879f9; }
.pc-msg-body pre {
  background: #0d1117; border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-sm); padding: 40px 12px 12px; margin: 8px 0;
  overflow-x: auto; font-size: 12px; line-height: 1.5; position: relative;
  color: var(--pc-text);
}
.pc-msg-body pre code { background: none; padding: 0; color: var(--pc-text); font-size: 12px; }
.pc-code-lang {
  position: absolute; top: 8px; left: 12px;
  font-size: 10px; color: var(--pc-text3); text-transform: uppercase;
  letter-spacing: 0.5px; font-weight: 600;
}
.pc-copy-btn {
  position: absolute; top: 6px; right: 8px;
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: var(--pc-bg3);
  border: 1px solid var(--pc-border); border-radius: 4px;
  color: var(--pc-text3); font-size: 10px; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.pc-copy-btn:hover { color: var(--pc-text); border-color: var(--pc-text3); }
.pc-msg-body blockquote {
  border-left: 3px solid var(--pc-accent); margin: 8px 0; padding: 6px 12px;
  color: var(--pc-text2); background: var(--pc-accent-l);
  border-radius: 0 var(--pc-radius-sm) var(--pc-radius-sm) 0;
}
.pc-msg-body a { color: var(--pc-accent-h); text-decoration: none; }
.pc-msg-body a:hover { text-decoration: underline; }
.pc-msg-body table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
.pc-msg-body th, .pc-msg-body td { border: 1px solid var(--pc-border); padding: 6px 10px; text-align: left; color: var(--pc-text); }
.pc-msg-body th { background: var(--pc-bg3); font-weight: 600; }
.pc-msg-body hr { border: none; border-top: 1px solid var(--pc-border); margin: 12px 0; }
.pc-msg-body strong { font-weight: 600; color: #f0f0f0; }
.pc-msg-body em { font-style: italic; }

.pc-typing { display: flex; gap: 4px; padding: 8px 14px; }
.pc-typing span {
  width: 6px; height: 6px; background: var(--pc-text3); border-radius: 50%;
  animation: pc-bounce 1.2s infinite;
}
.pc-typing span:nth-child(2) { animation-delay: 0.2s; }
.pc-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pc-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

#pc-settings-panel { display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 20px 16px; }
#pc-settings-panel.show-settings { display: flex; }
#pc-chat-panel.hide-chat { display: none; }
#pc-settings-panel label {
  display: block; font-size: 11px; font-weight: 600; color: var(--pc-text2);
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
#pc-settings-panel input, #pc-settings-panel select {
  width: 100%; padding: 10px 12px; background: var(--pc-bg3);
  border: 1px solid var(--pc-border); border-radius: var(--pc-radius-sm);
  color: var(--pc-text); font-size: 13px; font-family: inherit;
  outline: none; transition: border-color 0.2s; margin-bottom: 16px;
}
#pc-settings-panel input:focus, #pc-settings-panel select:focus {
  border-color: var(--pc-accent);
}
#pc-settings-panel select {
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238b8fa3' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
  background-color: var(--pc-bg3);
}
#pc-settings-panel .pc-input-wrap { position: relative; }
#pc-settings-panel .pc-input-wrap input { padding-right: 40px; }
#pc-toggle-key {
  position: absolute; right: 10px; top: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--pc-text3); padding: 4px; display: flex; border-radius: 4px;
}
#pc-toggle-key:hover { color: var(--pc-text2); background: var(--pc-bg3); }
#pc-save-settings {
  width: 100%; padding: 10px 20px; background: var(--pc-accent); color: white;
  border: none; border-radius: var(--pc-radius-sm); font-size: 13px;
  font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: inherit;
}
#pc-save-settings:hover { background: var(--pc-accent-h); }
.pc-settings-status { margin-top: 12px; font-size: 12px; text-align: center; min-height: 20px; }
.pc-settings-status.ok { color: var(--pc-success); }
.pc-settings-status.err { color: var(--pc-danger); }
#pc-settings-gear {
  background: none; border: none; cursor: pointer;
  color: var(--pc-text2); padding: 4px; display: flex;
  border-radius: 4px; transition: background 0.2s;
}
#pc-settings-gear:hover { background: var(--pc-bg3); color: var(--pc-text); }
#pc-settings-back {
  background: none; border: none; cursor: pointer;
  color: var(--pc-text2); padding: 4px 8px; display: none;
  font-size: 13px; border-radius: 4px; font-family: inherit;
}
#pc-settings-back:hover { background: var(--pc-bg3); color: var(--pc-text); }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'pc-sidebar-styles';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  const sidebarRoot = document.createElement('div');
  sidebarRoot.id = 'pc-sidebar-root';

  const toggleTab = document.createElement('div');
  toggleTab.id = 'pc-toggle-tab';
  toggleTab.innerHTML = 'AI CHAT';
  toggleTab.title = 'Open PageChat AI';

  toggleTab.addEventListener('click', openSidebar);

  sidebarRoot.innerHTML = `
    <div id="pc-sidebar">
      <div id="pc-sidebar-header">
        <div style="display:flex;align-items:center;gap:8px">
          <button id="pc-settings-back" title="Back to chat">&larr; Back</button>
          <span id="pc-sidebar-logo">PageChat AI</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <button id="pc-settings-gear" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button id="pc-sidebar-close" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="pc-sidebar-body">
        <div id="pc-settings-panel">
          <label>OpenRouter API Key</label>
          <div class="pc-input-wrap">
            <input type="password" id="pc-api-key" placeholder="sk-or-v1-..." autocomplete="off">
            <button id="pc-toggle-key" title="Show/Hide">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <label>Model</label>
          <select id="pc-model-select">
            <optgroup label="OpenAI"><option value="openai/gpt-4o">GPT-4o</option><option value="openai/gpt-4o-mini">GPT-4o Mini</option><option value="openai/o3-mini">o3 Mini</option></optgroup>
            <optgroup label="Anthropic"><option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option><option value="anthropic/claude-3-haiku">Claude 3 Haiku</option></optgroup>
            <optgroup label="Google"><option value="google/gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro</option><option value="google/gemini-2.5-flash-preview-05-06">Gemini 2.5 Flash</option><option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option></optgroup>
            <optgroup label="Meta"><option value="meta-llama/llama-4-maverick">Llama 4 Maverick</option><option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option></optgroup>
            <optgroup label="DeepSeek"><option value="deepseek/deepseek-chat-v3-0324">DeepSeek V3</option><option value="deepseek/deepseek-r1">DeepSeek R1</option></optgroup>
            <optgroup label="Mistral"><option value="mistralai/mistral-large">Mistral Large</option></optgroup>
          </select>
          <label>Custom Model ID (optional)</label>
          <input type="text" id="pc-custom-model" placeholder="provider/model-name" autocomplete="off">
          <span style="display:block;font-size:11px;color:var(--pc-text3);margin-top:-12px;margin-bottom:16px">Overrides dropdown if set</span>
          <button id="pc-save-settings">Save Settings</button>
          <div id="pc-settings-status" class="pc-settings-status"></div>
        </div>
        <div id="pc-chat-panel" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
          <div id="pc-page-info">
            <div id="pc-page-info-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <span id="pc-page-title">Loading page...</span>
          </div>
          <div id="pc-messages">
            <div class="pc-welcome">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color:var(--pc-accent);opacity:0.6;margin-bottom:8px" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <h2>Ask about this page</h2>
              <p>I've read the page content. Ask me anything!</p>
              <div class="pc-quick-actions">
                <button class="pc-quick-btn" data-pc-prompt="Summarize this page in 3-5 bullet points.">Summarize</button>
                <button class="pc-quick-btn" data-pc-prompt="What are the key points of this page?">Key Points</button>
                <button class="pc-quick-btn" data-pc-prompt="Explain this page like I'm 10 years old.">ELI5</button>
              </div>
            </div>
          </div>
          <div id="pc-input-area">
            <div id="pc-input-row">
              <textarea id="pc-user-input" placeholder="Ask about this page..." rows="1"></textarea>
              <button id="pc-send-btn" title="Send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <span id="pc-char-count">0</span>
          </div>
        </div>
      </div>
      <div id="pc-loading-overlay">
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <div class="pc-spinner"></div>
          <span style="font-size:12px;color:var(--pc-text2)">Thinking...</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sidebarRoot);
  document.body.appendChild(toggleTab);

  const sidebar = document.getElementById('pc-sidebar');
  const closeBtn = document.getElementById('pc-sidebar-close');
  const settingsGear = document.getElementById('pc-settings-gear');
  const settingsBack = document.getElementById('pc-settings-back');
  const settingsPanel = document.getElementById('pc-settings-panel');
  const chatPanel = document.getElementById('pc-chat-panel');
  const apiKeyInput = document.getElementById('pc-api-key');
  const modelSelect = document.getElementById('pc-model-select');
  const customModelInput = document.getElementById('pc-custom-model');
  const saveSettingsBtn = document.getElementById('pc-save-settings');
  const settingsStatus = document.getElementById('pc-settings-status');
  const toggleKeyBtn = document.getElementById('pc-toggle-key');
  const messagesContainer = document.getElementById('pc-messages');
  const userInput = document.getElementById('pc-user-input');
  const sendBtn = document.getElementById('pc-send-btn');
  const pageTitle = document.getElementById('pc-page-title');
  const loadingOverlay = document.getElementById('pc-loading-overlay');
  const charCount = document.getElementById('pc-char-count');

  let chatMessages = [];
  let pageContent = null;
  let isSettingsView = false;
  let isProcessing = false;
  let markedLoaded = false;

  function loadMarked() {
    return new Promise((resolve) => {
      if (markedLoaded) return resolve();
      const s = document.createElement('script');
      s.src = MARKED_SRC;
      s.onload = () => {
        markedLoaded = true;
        marked.setOptions({ breaks: true, gfm: true });
        const origRenderer = { code: marked.Renderer.prototype.code, link: marked.Renderer.prototype.link };
        Object.assign(marked.Renderer.prototype, {
          code(token) {
            const lang = token.lang || '';
            const code = token.text || '';
            let html = origRenderer.code.call(this, token);
            const langLabel = lang ? `<span class="pc-code-lang">${lang}</span>` : '';
            const btnHtml = `<button class="pc-copy-btn" data-pc-code="${encodeURIComponent(code)}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>`;
            html = html.replace('<pre>', `<pre>${langLabel}${btnHtml}`);
            return html;
          },
          link(token) {
            let html = origRenderer.link.call(this, token);
            return html.replace('<a ', '<a target="_blank" rel="noopener" ');
          }
        });
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  function openSidebar() {
    sidebar.classList.add('open');
    toggleTab.style.display = 'none';
    loadMarked();
    refreshPageContent();
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    toggleTab.style.display = 'flex';
  }

  function showSettings() {
    isSettingsView = true;
    settingsPanel.classList.add('show-settings');
    chatPanel.classList.add('hide-chat');
    settingsBack.style.display = 'inline-flex';
  }

  function hideSettings() {
    isSettingsView = false;
    settingsPanel.classList.remove('show-settings');
    chatPanel.classList.remove('hide-chat');
    settingsBack.style.display = 'none';
  }

  closeBtn.addEventListener('click', closeSidebar);
  settingsGear.addEventListener('click', showSettings);
  settingsBack.addEventListener('click', hideSettings);

  toggleKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const customModel = customModelInput.value.trim();
    if (!apiKey) {
      settingsStatus.textContent = 'Please enter your API key';
      settingsStatus.className = 'pc-settings-status err';
      return;
    }
    await chrome.storage.local.set({ apiKey, model, customModel });
    settingsStatus.textContent = 'Settings saved!';
    settingsStatus.className = 'pc-settings-status ok';
    setTimeout(() => { settingsStatus.textContent = ''; settingsStatus.className = 'pc-settings-status'; }, 2000);
    setTimeout(hideSettings, 600);
  });

  async function initSettings() {
    const s = await chrome.storage.local.get(['apiKey', 'model', 'customModel']);
    if (s.apiKey) apiKeyInput.value = s.apiKey;
    if (s.model) modelSelect.value = s.model;
    if (s.customModel) customModelInput.value = s.customModel;
  }

  async function refreshPageContent() {
    try {
      pageContent = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTENT', tabId: null });
      pageTitle.textContent = pageContent?.title || 'Page loaded';
    } catch (e) {
      pageTitle.textContent = 'Could not read page';
    }
  }

  userInput.addEventListener('input', () => {
    charCount.textContent = userInput.value.length;
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
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

    const settings = await chrome.storage.local.get(['apiKey', 'model', 'customModel']);
    if (!settings.apiKey) {
      showSettings();
      settingsStatus.textContent = 'Please enter your OpenRouter API key first';
      settingsStatus.className = 'pc-settings-status err';
      return;
    }

    const model = settings.customModel || settings.model || 'openai/gpt-4o-mini';
    isProcessing = true;
    userInput.value = '';
    userInput.style.height = 'auto';
    charCount.textContent = '0';
    sendBtn.disabled = true;
    loadingOverlay.classList.add('visible');

    const welcome = messagesContainer.querySelector('.pc-welcome');
    if (welcome) welcome.remove();

    appendMessage('user', text);
    chatMessages.push({ role: 'user', content: text });

    const typingId = appendTyping();

    try {
      await loadMarked();

      const messages = [
        { role: 'system', content: [
          'You are a helpful AI assistant. The user is asking about a web page. Here is the page content:',
          '', `Title: ${pageContent?.title || 'Unknown'}`, `URL: ${pageContent?.url || 'Unknown'}`,
          '', '--- PAGE CONTENT ---', pageContent?.content || 'No content', '--- END PAGE CONTENT ---',
          '', 'Answer based on this page content. Use Markdown for formatting.',
          'Be concise but thorough.'
        ].join('\n') },
        ...chatMessages
      ];

      const response = await chrome.runtime.sendMessage({
        type: 'CHAT', apiKey: settings.apiKey, model, messages
      });

      removeTyping(typingId);

      if (response.success) {
        const aiMsg = response.data.choices?.[0]?.message?.content || 'No response';
        chatMessages.push({ role: 'assistant', content: aiMsg });
        appendMessage('ai', aiMsg);
      } else {
        const err = response.error || 'Unknown error';
        chatMessages.push({ role: 'assistant', content: `Error: ${err}` });
        appendError(`Error: ${err}`);
      }
    } catch (e) {
      removeTyping(typingId);
      const err = e.message || 'Unknown error';
      chatMessages.push({ role: 'assistant', content: `Error: ${err}` });
      appendError(`Error: ${err}`);
    }

    isProcessing = false;
    sendBtn.disabled = false;
    loadingOverlay.classList.remove('visible');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    userInput.focus();
  }

  function appendMessage(role, content) {
    const wrap = document.createElement('div');
    wrap.className = `pc-msg-wrap ${role === 'user' ? 'pc-user' : ''}`;
    const avatar = document.createElement('div');
    avatar.className = 'pc-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';
    const msg = document.createElement('div');
    msg.className = `pc-msg ${role === 'user' ? 'pc-user' : 'pc-ai'}`;
    const label = document.createElement('div');
    label.className = 'pc-role-label';
    label.textContent = role === 'user' ? 'You' : 'Assistant';
    const body = document.createElement('div');
    body.className = 'pc-msg-body';
    if (role === 'ai') {
      body.innerHTML = marked.parse(content);
    } else {
      body.textContent = content;
    }
    msg.appendChild(label);
    msg.appendChild(body);
    wrap.appendChild(avatar);
    wrap.appendChild(msg);
    messagesContainer.appendChild(wrap);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendError(msg) {
    const wrap = document.createElement('div');
    wrap.className = 'pc-msg-wrap';
    const avatar = document.createElement('div');
    avatar.className = 'pc-avatar';
    avatar.textContent = 'AI';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'pc-msg pc-ai pc-error';
    const label = document.createElement('div');
    label.className = 'pc-role-label';
    label.textContent = 'Error';
    const body = document.createElement('div');
    body.className = 'pc-msg-body';
    body.textContent = msg;
    msgDiv.appendChild(label);
    msgDiv.appendChild(body);
    wrap.appendChild(avatar);
    wrap.appendChild(msgDiv);
    messagesContainer.appendChild(wrap);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'pc-msg-wrap';
    const avatar = document.createElement('div');
    avatar.className = 'pc-avatar';
    avatar.textContent = 'AI';
    const msg = document.createElement('div');
    msg.className = 'pc-msg pc-ai';
    const dots = document.createElement('div');
    dots.className = 'pc-typing';
    for (let i = 0; i < 3; i++) { const s = document.createElement('span'); dots.appendChild(s); }
    msg.appendChild(dots);
    wrap.appendChild(avatar);
    wrap.appendChild(msg);
    const id = 'pc-typing-' + Date.now();
    wrap.id = id;
    messagesContainer.appendChild(wrap);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  document.addEventListener('click', (e) => {
    const quickBtn = e.target.closest('.pc-quick-btn');
    if (quickBtn) {
      const prompt = quickBtn.dataset.pcPrompt;
      if (prompt && sidebar.classList.contains('open')) {
        userInput.value = prompt;
        userInput.dispatchEvent(new Event('input'));
        sendMessage();
      }
    }
    const copyBtn = e.target.closest('.pc-copy-btn');
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.dataset.pcCode);
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => { copyBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'; }, 2000);
      }).catch(() => {});
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE_SIDEBAR') {
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
      sendResponse({ success: true });
    }
    return true;
  });

  initSettings();
  refreshPageContent();
})();