(function () {
  if (!window.GemielleWidget) return;
  const { STATES, setState, getState } = window.GemielleWidget;

  let typingTimeout;
  let imageThinkingTimeout = null;
  let aiObserver;
  let checkingAITyping = false;
  let existingResponseElements = new Set();

  const THINKING_SELECTORS =
    'gdm-thought-viewer, thought-viewer, gdm-thought-process, thought-process, gdm-reasoning-viewer, reasoning-viewer, .thought-container, .thought-viewer, .thought-process, .thought-header, .thought-chunk, .thinking-container, .thinking-process, .thinking-header, .thinking-chunk, .reasoning-container, .reasoning-process, .reasoning-header, [data-test-id="thought-container"], [data-test-id="thought-viewer"], [data-test-id="thinking-container"], gdm-grounding-drawer, grounding-chips, .grounding-container, search-entry-point, details, summary, mat-expansion-panel, .mat-expansion-panel';

  function captureExistingResponses() {
    existingResponseElements.clear();
    const elements = document.querySelectorAll(
      'model-response, .model-response, [data-test-id="model-response"], message-content, .message-content'
    );
    elements.forEach((el) => existingResponseElements.add(el));
  }

  function isActualAnswerContentMutation(mutation) {
    let targetEl = null;

    if (mutation.type === 'characterData') {
      targetEl = mutation.target.parentElement;
    } else if (mutation.type === 'childList') {
      for (let node of mutation.addedNodes) {
        let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (el) {
          targetEl = el;
          break;
        }
      }
    }

    if (!targetEl) return false;

    // 1. Phải NẰM TRONG khối câu trả lời của AI (<model-response>)
    const modelResponse = targetEl.closest(
      'model-response, .model-response, [data-test-id="model-response"]'
    );
    if (!modelResponse) return false;

    // Tuyệt đối KHÔNG ĐƯỢC nằm trong câu hỏi người dùng
    if (targetEl.closest('user-query, .user-query, [data-test-id="user-query"], [class*="user-query"]')) {
      return false;
    }

    // 2. Kiểm tra xem modelResponse có thuộc về các khối trả lời ĐÃ TỒN TẠI TỪ TRƯỚC hay không
    if (existingResponseElements.has(modelResponse)) {
      return false;
    }
    for (let oldEl of existingResponseElements) {
      if (oldEl.contains(targetEl)) {
        return false;
      }
    }

    // 3. Phải KHÔNG NẰM TRONG khối suy nghĩ (Thought Viewer)
    if (targetEl.closest(THINKING_SELECTORS)) {
      return false;
    }

    // 4. Phải NẰM TRONG container nội dung câu trả lời (message-content hoặc .markdown)
    const answerContainer = targetEl.closest('message-content, .message-content, .markdown');
    if (!answerContainer) return false;

    // 5. Phải chứa chữ thật sự (loại trừ khối suy nghĩ) HOẶC chứa thẻ hình ảnh
    let checkEl = targetEl.cloneNode(true);
    if (checkEl.querySelectorAll) {
      const thinkingNodes = checkEl.querySelectorAll(THINKING_SELECTORS);
      thinkingNodes.forEach((node) => node.remove());
    }
    const text = (checkEl.textContent || '').trim();
    const hasImage = !!(
      ['IMG', 'PICTURE', 'CANVAS', 'GDM-IMAGE-CARD'].includes(targetEl.tagName) ||
      targetEl.querySelector('img, picture, canvas, gdm-image-card')
    );

    return text.length > 0 || hasImage;
  }

  function scheduleImageTypingTransition() {
    if (imageThinkingTimeout) return;
    imageThinkingTimeout = setTimeout(() => {
      imageThinkingTimeout = null;
      if (getState() === STATES.AI_THINKING) {
        setState(STATES.AI_TYPING);
      }
    }, 1000);
  }

  function isImageGenerationMutation(mutation) {
    let targetEl = null;
    if (mutation.type === 'characterData') {
      targetEl = mutation.target.parentElement;
    } else if (mutation.type === 'childList') {
      for (let node of mutation.addedNodes) {
        let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (el) {
          targetEl = el;
          break;
        }
      }
    }
    if (!targetEl) return false;

    const modelResponse = targetEl.closest('model-response, .model-response, [data-test-id="model-response"]');
    if (!modelResponse) return false;

    for (let oldEl of existingResponseElements) {
      if (oldEl.contains(targetEl)) return false;
    }

    if (targetEl.closest(THINKING_SELECTORS)) return false;

    const isImgCard = !!(
      ['IMG', 'PICTURE', 'CANVAS', 'GDM-IMAGE-CARD', 'GDM-IMAGE-GENERATION'].includes(targetEl.tagName) ||
      targetEl.querySelector('img, picture, canvas, gdm-image-card, gdm-image-generation, [class*="image"], [class*="media"], [data-test-id*="image"]') ||
      targetEl.closest('gdm-image-card, gdm-image-generation, [class*="image"], [class*="media"], [data-test-id*="image"]')
    );
    if (isImgCard) return true;

    const text = (targetEl.textContent || '').toLowerCase();
    if (
      text.includes('tạo hình ảnh') ||
      text.includes('generating image') ||
      text.includes('creating image') ||
      text.includes('hình ảnh của bạn')
    ) {
      return true;
    }

    return false;
  }

  // Kiểm tra xem response MỚI NHẤT đã thực sự có nội dung hoàn chỉnh chưa
  function isLatestResponseComplete() {
    const allResponses = document.querySelectorAll('model-response, .model-response, [data-test-id="model-response"]');
    let latestNew = null;
    for (let i = allResponses.length - 1; i >= 0; i--) {
      if (!existingResponseElements.has(allResponses[i])) {
        latestNew = allResponses[i];
        break;
      }
    }
    if (!latestNew) return false;

    // 1. Kiểm tra có ảnh đã load thành công chưa
    const images = latestNew.querySelectorAll('img[src]');
    for (const img of images) {
      if (img.complete && img.naturalWidth > 0) return true;
    }

    // 2. Kiểm tra có khối markdown chứa text thật (>10 ký tự, loại trừ status text suy nghĩ)
    const markdowns = latestNew.querySelectorAll('.markdown, [class*="markdown"]');
    for (const md of markdowns) {
      if (md.closest(THINKING_SELECTORS)) continue;
      let checkEl = md.cloneNode(true);
      if (checkEl.querySelectorAll) {
        const thinkingNodes = checkEl.querySelectorAll(THINKING_SELECTORS);
        thinkingNodes.forEach((node) => node.remove());
      }
      const text = (checkEl.textContent || '').trim();
      if (text.length > 10) return true;
    }

    return false;
  }

  function getLatestNewResponse() {
    const allResponses = document.querySelectorAll('model-response, .model-response, [data-test-id="model-response"]');
    for (let i = allResponses.length - 1; i >= 0; i--) {
      if (!existingResponseElements.has(allResponses[i])) {
        return allResponses[i];
      }
    }
    return null;
  }

  function hasCompletedImage(container) {
    if (!container) return false;
    const images = container.querySelectorAll('img[src]');
    for (const img of images) {
      if (img.complete && img.naturalWidth > 0) return true;
    }
    return false;
  }

  let completionPollInterval = null;

  function startAITypingDetection() {
    if (checkingAITyping) return;
    checkingAITyping = true;
    captureExistingResponses();

    const targetContainer =
      document.querySelector('main') || document.querySelector('[role="main"]') || document.body;

    let lastMutationTime = Date.now();

    aiObserver = new MutationObserver((mutations) => {
      let hasContentGeneration = false;
      let hasImageGeneration = false;

      for (let mutation of mutations) {
        let targetEl = mutation.target.parentElement || mutation.target;
        if (targetEl && targetEl.closest && targetEl.closest('model-response, .model-response, [data-test-id="model-response"]')) {
          lastMutationTime = Date.now();
        }

        if (isImageGenerationMutation(mutation)) {
          hasImageGeneration = true;
        }
        if (isActualAnswerContentMutation(mutation)) {
          hasContentGeneration = true;
          break;
        }
      }

      if (hasImageGeneration && getState() === STATES.AI_THINKING) {
        scheduleImageTypingTransition();
      }

      if (hasContentGeneration) {
        lastMutationTime = Date.now();

        if (getState() === STATES.AI_THINKING) {
          setState(STATES.AI_TYPING);
        }
      }
    });

    aiObserver.observe(targetContainer, { childList: true, characterData: true, subtree: true });

    // Polling mỗi 300ms: kiểm tra xem response đã hoàn chỉnh chưa
    completionPollInterval = setInterval(() => {
      const state = getState();
      if (state !== STATES.AI_THINKING && state !== STATES.AI_TYPING) {
        stopAITypingDetection();
        return;
      }

      const timeSinceLastMutation = Date.now() - lastMutationTime;

      // Chỉ xét hoàn thành nếu DOM đã ngừng thay đổi >= 800ms
      if (timeSinceLastMutation < 800) return;

      // Nếu đang ở trạng thái AI_THINKING, chỉ complete nếu đã có ảnh tạo xong
      if (state === STATES.AI_THINKING) {
        const latestNew = getLatestNewResponse();
        if (latestNew && hasCompletedImage(latestNew)) {
          setState(STATES.AI_COMPLETE);
          stopAITypingDetection();
        }
        return;
      }

      // Đã ở trạng thái AI_TYPING và câu trả lời đã hoàn chỉnh
      if (state === STATES.AI_TYPING && isLatestResponseComplete()) {
        setState(STATES.AI_COMPLETE);
        stopAITypingDetection();
      }
    }, 300);

    // Safety timeout: tối đa 2 phút
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
    clearTimeout(typingTimeout);
    clearTimeout(imageThinkingTimeout);
    imageThinkingTimeout = null;
    checkingAITyping = false;
  }

  function setupUserTypingDetection() {
    const handleInputChange = (target) => {
      if (!target) return;
      if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
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
          if (e.target.isContentEditable || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            const text = e.target.textContent || e.target.value || '';
            if (text.trim().length > 0) {
              setState(STATES.AI_THINKING);
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
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
          if (getState() === STATES.USER_TYPING) {
            setTimeout(() => {
              let activeInput = document.querySelector(
                'p[data-placeholder="Enter a prompt here"], div[contenteditable="true"], textarea'
              );
              let isEmpty = true;
              if (activeInput) {
                const text = activeInput.textContent || activeInput.value || '';
                if (text.trim().length > 0) {
                  isEmpty = false;
                }
              } else {
                const editables = document.querySelectorAll('div[contenteditable="true"], textarea');
                for (let ed of editables) {
                  const text = ed.textContent || ed.value || '';
                  if (text.trim().length > 0) {
                    isEmpty = false;
                    break;
                  }
                }
              }

              if (isEmpty) {
                setState(STATES.AI_THINKING);
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
})();
