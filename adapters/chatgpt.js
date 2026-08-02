(function () {
  if (!window.GemielleWidget) return;
  const { STATES, setState, getState } = window.GemielleWidget;

  let typingTimeout;
  let completionDebounceTimeout = null;
  let aiObserver;
  let checkingAITyping = false;
  let completionPollInterval = null;
  let passivePollInterval = null;
  let lastKnownTurnCount = 0;
  let lastLocationHref = typeof location !== 'undefined' ? location.href : '';
  let thinkingStartTime = 0;
  let transitionToTypingTimeout = null;

  // Trái với chuyển đổi tức thì, giữ AI_THINKING tối thiểu 1000ms (1s)
  function triggerAIThinking() {
    clearTimeout(transitionToTypingTimeout);
    transitionToTypingTimeout = null;
    thinkingStartTime = Date.now();
    setState(STATES.AI_THINKING);
  }

  function tryTransitionToTyping() {
    if (getState() !== STATES.AI_THINKING) return;

    const elapsed = Date.now() - thinkingStartTime;
    const minThinkingDuration = 1000; // 1 giây tối thiểu

    if (elapsed >= minThinkingDuration) {
      setState(STATES.AI_TYPING);
    } else if (!transitionToTypingTimeout) {
      transitionToTypingTimeout = setTimeout(() => {
        transitionToTypingTimeout = null;
        if (getState() === STATES.AI_THINKING) {
          setState(STATES.AI_TYPING);
        }
      }, minThinkingDuration - elapsed);
    }
  }

  // === PHÁT HIỆN NÚT STOP (Đa ngôn ngữ) ===
  function isStopButtonVisible() {
    // 1. data-testid (không phụ thuộc ngôn ngữ)
    if (document.querySelector('button[data-testid="stop-button"]')) return true;

    // 2. aria-label chứa từ khóa stop đa ngôn ngữ
    const stopKeywords = ['stop', 'dừng', 'hủy', 'cancel', 'arrêter', 'detener'];
    const buttons = document.querySelectorAll('button[aria-label]');
    for (const btn of buttons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (stopKeywords.some(kw => label.includes(kw))) return true;
    }

    // 3. Tìm nút có icon hình vuông (■ stop icon) trong vùng nhập liệu
    const composerForms = document.querySelectorAll('form, [class*="composer"], [class*="input-area"]');
    for (const form of composerForms) {
      const btns = form.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.querySelector('svg rect:not([rx])')) return true;
        const text = (btn.textContent || '').trim();
        if (text === '■' || text === '◼') return true;
      }
    }

    return false;
  }

  // === ĐẾM SỐ TURN CUỘC HỘI THOẠI ===
  function countConversationTurns() {
    return document.querySelectorAll(
      '[data-message-id], [data-message-author-role], article[data-testid]'
    ).length;
  }

  // === KIỂM TRA RESPONSE MỚI NHẤT ĐÃ HOÀN CHỈNH CHƯA ===
  function isLatestResponseComplete() {
    const allMsgs = document.querySelectorAll('[data-message-author-role="assistant"]');
    const latest = allMsgs.length > 0 ? allMsgs[allMsgs.length - 1] : null;

    if (latest) {
      // 1. Có ảnh đã load thành công
      const images = latest.querySelectorAll('img[src]');
      for (const img of images) {
        if (img.complete && img.naturalWidth > 0) return true;
      }
      // 2. Có text markdown/prose thật (>5 ký tự)
      const blocks = latest.querySelectorAll('.markdown, .prose, p, li, pre, td');
      for (const b of blocks) {
        if ((b.textContent || '').trim().length > 5) return true;
      }
    }

    // Fallback: kiểm tra article cuối cùng
    const articles = document.querySelectorAll('article[data-testid]');
    if (articles.length > 0) {
      const lastArticle = articles[articles.length - 1];
      const images = lastArticle.querySelectorAll('img[src]');
      for (const img of images) {
        if (img.complete && img.naturalWidth > 0) return true;
      }
      const blocks = lastArticle.querySelectorAll('.markdown, .prose, p, li, pre, td');
      for (const b of blocks) {
        if ((b.textContent || '').trim().length > 5) return true;
      }
    }

    return false;
  }

  // === BẮT ĐẦU PHÁT HIỆN AI ĐANG GÕ ===
  function startAITypingDetection() {
    if (checkingAITyping) return;
    checkingAITyping = true;

    const targetContainer =
      document.querySelector('main') || document.querySelector('#__next') || document.body;

    aiObserver = new MutationObserver((mutations) => {
      let hasNewContent = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (
              node.closest('[data-message-author-role="assistant"]') ||
              (node.querySelector && (
                node.querySelector('.markdown, .prose, img, p') ||
                node.classList?.contains('markdown') ||
                node.classList?.contains('result-streaming')
              ))
            ) {
              hasNewContent = true;
              break;
            }
          }
        } else if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement;
          if (parent && parent.closest('[data-message-author-role="assistant"], .markdown, .prose')) {
            hasNewContent = true;
          }
        }
        if (hasNewContent) break;
      }

      if (hasNewContent) {
        tryTransitionToTyping();
      }
    });

    aiObserver.observe(targetContainer, { childList: true, characterData: true, subtree: true });

    // Polling nhanh mỗi 400ms: phát hiện hoàn thành ngay khi nút Stop biến mất
    completionPollInterval = setInterval(() => {
      const state = getState();
      if (state !== STATES.AI_THINKING && state !== STATES.AI_TYPING) {
        stopAITypingDetection();
        return;
      }

      const stopVisible = isStopButtonVisible();
      const streamingVisible = !!document.querySelector('.result-streaming');

      // Khi nút Stop biến mất & không còn stream -> phản hồi đã xong
      if (!stopVisible && !streamingVisible) {
        if (isLatestResponseComplete()) {
          clearTimeout(completionDebounceTimeout);
          completionDebounceTimeout = setTimeout(() => {
            if (!isStopButtonVisible() && !document.querySelector('.result-streaming')) {
              setState(STATES.AI_COMPLETE);
              stopAITypingDetection();
            }
          }, 300);
        }
      }
    }, 400);

    // Safety timeout: 2 phút
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (getState() === STATES.AI_THINKING || getState() === STATES.AI_TYPING) {
        setState(STATES.WAITING);
        stopAITypingDetection();
      }
    }, 120000);
  }

  function stopAITypingDetection() {
    if (aiObserver) {
      aiObserver.disconnect();
      aiObserver = null;
    }
    if (completionPollInterval) {
      clearInterval(completionPollInterval);
      completionPollInterval = null;
    }
    clearTimeout(transitionToTypingTimeout);
    transitionToTypingTimeout = null;
    clearTimeout(completionDebounceTimeout);
    completionDebounceTimeout = null;
    clearTimeout(typingTimeout);
    typingTimeout = null;
    checkingAITyping = false;
  }

  // === POLLING PASSIVE: Luôn chạy nền, phát hiện AI bắt đầu trả lời ===
  function setupPassiveDetector() {
    lastKnownTurnCount = countConversationTurns();
    lastLocationHref = location.href;

    passivePollInterval = setInterval(() => {
      if (location.href !== lastLocationHref) {
        lastLocationHref = location.href;
        lastKnownTurnCount = countConversationTurns();
      }

      const state = getState();
      if (state !== STATES.WAITING && state !== STATES.USER_TYPING) return;
      if (checkingAITyping) return;

      // 1. Kiểm tra nút Stop xuất hiện
      if (isStopButtonVisible()) {
        triggerAIThinking();
        startAITypingDetection();
        return;
      }

      // 2. Kiểm tra .result-streaming xuất hiện
      if (document.querySelector('.result-streaming')) {
        triggerAIThinking();
        startAITypingDetection();
        return;
      }

      // 3. Kiểm tra số turn tăng
      const currentCount = countConversationTurns();
      if (currentCount > lastKnownTurnCount) {
        lastKnownTurnCount = currentCount;
        const hasStreamingSignal = isStopButtonVisible() || !!document.querySelector('.result-streaming');
        if (hasStreamingSignal) {
          triggerAIThinking();
          startAITypingDetection();
        }
        return;
      }
    }, 400);
  }

  // === PHÁT HIỆN USER GÕ CHỮ ===
  function setupUserTypingDetection() {
    const handleInputChange = (target) => {
      if (!target) return;
      if (
        target.id === 'prompt-textarea' ||
        target.isContentEditable ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'INPUT'
      ) {
        const text = target.textContent || target.value || '';
        if (text.trim().length > 0) {
          if (getState() !== STATES.AI_THINKING && getState() !== STATES.AI_TYPING) {
            setState(STATES.USER_TYPING);
          }
        } else {
          if (getState() !== STATES.AI_THINKING && getState() !== STATES.AI_TYPING) {
            setState(STATES.WAITING);
          }
        }
      }
    };

    document.body.addEventListener('input', (e) => handleInputChange(e.target));
    document.body.addEventListener('paste', (e) => {
      setTimeout(() => handleInputChange(e.target), 50);
    });
    document.body.addEventListener('keyup', (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInputChange(e.target);
      }
    });

    document.body.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const target = e.target;
          if (
            target.id === 'prompt-textarea' ||
            target.isContentEditable ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'INPUT'
          ) {
            const text = target.textContent || target.value || '';
            if (text.trim().length > 0) {
              lastKnownTurnCount = countConversationTurns();
              triggerAIThinking();
              startAITypingDetection();
            }
          }
        }
      },
      true
    );

    document.body.addEventListener('click', (e) => {
      let target = e.target;
      while (target != null && target !== document.body) {
        if (
          target.tagName === 'BUTTON' ||
          target.getAttribute('role') === 'button' ||
          target.getAttribute('data-testid') === 'send-button'
        ) {
          if (getState() === STATES.USER_TYPING) {
            setTimeout(() => {
              let activeInput = document.querySelector(
                '#prompt-textarea, div[contenteditable="true"], textarea'
              );
              let isEmpty = true;
              if (activeInput) {
                const text = activeInput.textContent || activeInput.value || '';
                if (text.trim().length > 0) isEmpty = false;
              }
              if (isEmpty) {
                lastKnownTurnCount = countConversationTurns();
                triggerAIThinking();
                startAITypingDetection();
              }
            }, 200);
          }
          break;
        }
        target = target.parentElement;
      }
    });
  }

  setupUserTypingDetection();
  setupPassiveDetector();
})();
