const PROVIDERS = {
  openrouter: {
    chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    extraHeaders: (key) => ({
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': chrome.runtime.id,
      'X-Title': 'PageChat AI'
    }),
    parseModels: (data) => (data.data || []).map(m => ({
      id: m.id,
      name: m.name || m.id,
      provider: m.id.includes('/') ? m.id.split('/')[0] : 'openrouter'
    }))
  },
  deepseek: {
    chatUrl: 'https://api.deepseek.com/v1/chat/completions',
    modelsUrl: 'https://api.deepseek.com/v1/models',
    extraHeaders: (key) => ({ 'Authorization': `Bearer ${key}` }),
    parseModels: (data) => (data.data || []).map(m => ({
      id: m.id,
      name: m.id,
      provider: 'deepseek'
    }))
  }
};

let cachedPageContent = null;

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js', 'content/sidebar.js']
      });
      setTimeout(async () => {
        try { await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' }); } catch (e2) {}
      }, 300);
    } catch (e1) {}
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') cachedPageContent = null;
});

async function getPageContent(tabId) {
  if (cachedPageContent && cachedPageContent.tabId === tabId) return cachedPageContent.data;
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTENT' });
    if (response && response.content) {
      cachedPageContent = { tabId, data: response };
      return response;
    }
  } catch (e) { }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { title: '', url: '', content: '' };

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.title || '';
        const url = location.href;
        let mainContent = '';
        const sel = document.querySelector('article,[role="main"],main,.article,.post');
        if (sel) mainContent = sel.textContent.replace(/\s+/g, ' ').trim();
        else mainContent = document.body.textContent.replace(/\s+/g, ' ').trim();
        if (mainContent.length > 15000) mainContent = mainContent.substring(0, 15000) + '...';
        return { title, url, content: mainContent };
      }
    });
    if (results?.[0]?.result) {
      cachedPageContent = { tabId: tab.id, data: results[0].result };
      return results[0].result;
    }
  } catch (err2) { }
  return { title: '', url: '', content: '' };
}

async function callAPI(provider, apiKey, model, messages) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);

  const body = provider === 'deepseek'
    ? JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 })
    : JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 });

  const response = await fetch(cfg.chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cfg.extraHeaders(apiKey) },
    body
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  return response.json();
}

async function fetchModels(provider, apiKey) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);

  const response = await fetch(cfg.modelsUrl, {
    headers: { ...cfg.extraHeaders(apiKey) }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return cfg.parseModels(data);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PAGE_CONTENT') {
    getPageContent(msg.tabId).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.type === 'CHAT') {
    (async () => {
      try {
        const { provider, apiKey, model, messages } = msg;
        const result = await callAPI(provider, apiKey, model, messages);
        sendResponse({ success: true, data: result });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (msg.type === 'FETCH_MODELS') {
    (async () => {
      try {
        const { provider, apiKey } = msg;
        const models = await fetchModels(provider, apiKey);
        sendResponse({ success: true, data: models });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (msg.type === 'CLEAR_CACHE') {
    cachedPageContent = null;
    sendResponse({ success: true });
    return true;
  }
});