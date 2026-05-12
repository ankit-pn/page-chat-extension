(function () {
  'use strict';

  function getPageContent() {
    const title = document.title || '';
    const url = location.href;

    let mainContent = '';

    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content',
      '.main-content',
      '#main',
      '.post',
      '.article'
    ];

    let container = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 200) {
        container = el;
        break;
      }
    }

    if (!container) {
      const candidates = [];
      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (node.matches && node.matches('script,style,noscript,nav,footer,header,aside,.sidebar,.nav,.menu,.footer,.header,.comment,.ad,iframe,form')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      while (walk.nextNode()) {
        const el = walk.currentNode;
        const textLen = el.textContent.trim().length;
        const tagCount = el.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,pre,blockquote,td,th').length;
        if (textLen > 300 && tagCount >= 3) {
          const ratio = tagCount / Math.max(1, el.querySelectorAll('*').length);
          candidates.push({ el, score: textLen * ratio });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      if (candidates.length) container = candidates[0].el;
    }

    if (container) {
      mainContent = container.textContent.replace(/\s+/g, ' ').trim();
    } else {
      mainContent = document.body.textContent.replace(/\s+/g, ' ').trim();
    }

    const maxLen = 15000;
    if (mainContent.length > maxLen) {
      mainContent = mainContent.substring(0, maxLen) + '... [truncated]';
    }

    return { title, url, content: mainContent };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_PAGE_CONTENT') {
      sendResponse(getPageContent());
    }
    return true;
  });
})();