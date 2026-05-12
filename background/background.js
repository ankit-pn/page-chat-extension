const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

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

async function callOpenRouter(apiKey, model, messages) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': chrome.runtime.id,
      'X-Title': 'PageChat AI'
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  return response.json();
}

async function fetchOpenRouterModels(apiKey) {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return (data.data || []).map(m => ({
    id: m.id,
    name: m.name || m.id,
    provider: m.id.includes('/') ? m.id.split('/')[0] : 'openrouter'
  }));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_PAGE_CONTENT') {
    getPageContent(msg.tabId).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }

  if (msg.type === 'CHAT') {
    (async () => {
      try {
        const { apiKey, model, messages } = msg;
        const result = await callOpenRouter(apiKey, model, messages);
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
        const { apiKey } = msg;
        const models = await fetchOpenRouterModels(apiKey);
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