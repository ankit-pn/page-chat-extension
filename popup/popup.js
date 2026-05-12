(function () {
  'use strict';

  const CopyIconSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const CopiedSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;

  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });

    const origRenderer = {
      code: marked.Renderer.prototype.code,
      link: marked.Renderer.prototype.link
    };

    const renderer = {
      code(token) {
        const lang = token.lang || '';
        const code = token.text || '';
        let html = origRenderer.code.call(this, token);
        const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
        const btnHtml = `<button class="copy-code-btn" data-code="${encodeURIComponent(code)}">${CopyIconSVG} Copy</button>`;
        html = html.replace('<pre>', `<pre>${langLabel}${btnHtml}`);
        return html;
      },
      link(token) {
        let html = origRenderer.link.call(this, token);
        return html.replace('<a ', '<a target="_blank" rel="noopener" ');
      }
    };

    Object.assign(marked.Renderer.prototype, renderer);
  }

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsView = document.getElementById('settingsView');
  const chatView = document.getElementById('chatView');
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const customModelInput = document.getElementById('customModel');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsStatus = document.getElementById('settingsStatus');
  const toggleKeyBtn = document.getElementById('toggleKeyBtn');
  const messagesContainer = document.getElementById('messagesContainer');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const pageTitle = document.getElementById('pageTitle');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const charCount = document.getElementById('charCount');

  let chatMessages = [];
  let pageContent = null;
  let isSettingsView = false;
  let isProcessing = false;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PAGE_CONTENT_UPDATED' && msg.data) {
      pageContent = msg.data;
      pageTitle.textContent = msg.data.title || 'Page loaded';
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PAGE_CONTENT_UPDATED' && msg.data) {
      pageContent = msg.data;
      pageTitle.textContent = msg.data.title || 'Page loaded';
    }
  });

  async function init() {
    const settings = await chrome.storage.local.get(['apiKey', 'model', 'customModel']);
    if (settings.apiKey) apiKeyInput.value = settings.apiKey;
    if (settings.model) modelSelect.value = settings.model;
    if (settings.customModel) customModelInput.value = settings.customModel;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      try {
        pageContent = await chrome.runtime.sendMessage({
          type: 'GET_PAGE_CONTENT',
          tabId: tabs[0].id
        });
        pageTitle.textContent = pageContent?.title || 'Page loaded';
      } catch (e) {
        pageTitle.textContent = 'Could not read page';
        console.error('Failed to get page content:', e);
      }
    }
  }

  settingsBtn.addEventListener('click', () => {
    isSettingsView = !isSettingsView;
    if (isSettingsView) {
      settingsView.classList.remove('hidden');
      chatView.classList.add('hidden');
    } else {
      settingsView.classList.add('hidden');
      chatView.classList.remove('hidden');
    }
  });

  toggleKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const customModel = customModelInput.value.trim();

    if (!apiKey) {
      showStatus('Please enter your OpenRouter API key', 'error');
      return;
    }

    await chrome.storage.local.set({ apiKey, model, customModel });
    showStatus('Settings saved!', 'success');
    setTimeout(() => {
      isSettingsView = false;
      settingsView.classList.add('hidden');
      chatView.classList.remove('hidden');
    }, 800);
  });

  function showStatus(msg, type) {
    settingsStatus.textContent = msg;
    settingsStatus.className = `status-msg ${type}`;
    setTimeout(() => {
      settingsStatus.textContent = '';
      settingsStatus.className = 'status-msg';
    }, 3000);
  }

  userInput.addEventListener('input', () => {
    const len = userInput.value.length;
    charCount.textContent = len;
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
      appendError('Please set your OpenRouter API key in Settings first.');
      isSettingsView = true;
      settingsView.classList.remove('hidden');
      chatView.classList.add('hidden');
      return;
    }

    const model = settings.customModel || settings.model || 'openai/gpt-4o-mini';
    isProcessing = true;
    userInput.value = '';
    userInput.style.height = 'auto';
    charCount.textContent = '0';
    sendBtn.disabled = true;
    showLoading(true);

    const welcome = messagesContainer.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    appendMessage('user', text);
    chatMessages.push({ role: 'user', content: text });

    const typingId = appendTypingIndicator();

    try {
      const messages = [
        {
          role: 'system',
          content: [
            'You are a helpful AI assistant. The user is asking questions about a web page.',
            'Here is the page content for context:',
            '',
            `Title: ${pageContent?.title || 'Unknown'}`,
            `URL: ${pageContent?.url || 'Unknown'}`,
            '',
            '--- PAGE CONTENT ---',
            pageContent?.content || 'No content extracted',
            '--- END PAGE CONTENT ---',
            '',
            'Answer the user\'s questions based on this page content.',
            'If the question is not related to the page, you can still answer it generally.',
            'Format your responses using Markdown for clarity. Use headers, bullet points, code blocks, tables where appropriate.',
            'Be concise but thorough.'
          ].join('\n')
        },
        ...chatMessages
      ];

      const response = await chrome.runtime.sendMessage({
        type: 'CHAT',
        apiKey: settings.apiKey,
        model,
        messages
      });

      removeTypingIndicator(typingId);

      if (response.success) {
        const aiMsg = response.data.choices?.[0]?.message?.content || 'No response';
        chatMessages.push({ role: 'assistant', content: aiMsg });
        appendMessage('ai', aiMsg);
      } else {
        const errMsg = response.error || 'Unknown error';
        chatMessages.push({ role: 'assistant', content: `Error: ${errMsg}` });
        appendError(`Error: ${errMsg}`);
      }
    } catch (e) {
      removeTypingIndicator(typingId);
      const errMsg = e.message || 'Unknown error';
      chatMessages.push({ role: 'assistant', content: `Error: ${errMsg}` });
      appendError(`Error: ${errMsg}`);
    }

    isProcessing = false;
    sendBtn.disabled = false;
    showLoading(false);
    scrollToBottom();
    userInput.focus();
  }

  function appendMessage(role, content) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${role === 'user' ? 'user-msg' : 'ai-msg'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'message-role';
    roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';

    const body = document.createElement('div');
    body.className = 'msg-body';

    if (role === 'ai') {
      body.innerHTML = marked.parse(content);
    } else {
      body.textContent = content;
    }

    msgDiv.appendChild(roleLabel);
    msgDiv.appendChild(body);
    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
  }

  function appendError(msg) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper ai-msg';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai error';
    const roleLabel = document.createElement('div');
    roleLabel.className = 'message-role';
    roleLabel.textContent = 'Error';
    const body = document.createElement('div');
    body.className = 'msg-body';
    body.textContent = msg;
    msgDiv.appendChild(roleLabel);
    msgDiv.appendChild(body);
    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
  }

  function appendTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper ai-msg';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ai';
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
      indicator.appendChild(document.createElement('span'));
    }
    msgDiv.appendChild(indicator);
    wrapper.appendChild(avatar);
    wrapper.appendChild(msgDiv);
    wrapper.id = 'typing-' + Date.now();
    messagesContainer.appendChild(wrapper);
    scrollToBottom();
    return wrapper.id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-btn') || e.target.closest('.quick-btn')) {
      const btn = e.target.classList.contains('quick-btn') ? e.target : e.target.closest('.quick-btn');
      const prompt = btn.dataset.prompt;
      if (prompt) {
        userInput.value = prompt;
        userInput.dispatchEvent(new Event('input'));
        sendMessage();
      }
    }

    if (e.target.closest('.copy-code-btn')) {
      const btn = e.target.closest('.copy-code-btn');
      const code = decodeURIComponent(btn.dataset.code);
      navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = `${CopiedSVG} Copied!`;
        setTimeout(() => { btn.innerHTML = `${CopyIconSVG} Copy`; }, 2000);
      }).catch(() => {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.innerHTML = `${CopyIconSVG} Copy`; }, 2000);
      });
    }
  });

  init();
})();