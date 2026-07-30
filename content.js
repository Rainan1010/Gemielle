const ASSETS = {
  WAITING: chrome.runtime.getURL('assets/waiting_user_input.gif'),
  USER_TYPING: chrome.runtime.getURL('assets/user_typing.gif'),
  AI_THINKING: chrome.runtime.getURL('assets/ai_thingking.gif'), // Note the typo in the file name
  AI_TYPING: chrome.runtime.getURL('assets/ai_typing.gif'),
  AI_COMPLETE: chrome.runtime.getURL('assets/ai_complete_answer.gif')
};

const STATES = {
  WAITING: 'WAITING',
  USER_TYPING: 'USER_TYPING',
  AI_THINKING: 'AI_THINKING',
  AI_TYPING: 'AI_TYPING',
  AI_COMPLETE: 'AI_COMPLETE'
};

let currentState = STATES.WAITING;
let widgetImg;

function createWidget() {
  const container = document.createElement('div');
  container.id = 'gemini-ai-widget-container';

  widgetImg = document.createElement('img');
  widgetImg.src = ASSETS.WAITING;
  widgetImg.alt = 'AI Assistant Status';

  container.appendChild(widgetImg);
  document.body.appendChild(container);

  makeDraggable(container);
}

function makeDraggable(container) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Chỉ kéo khi bấm chuột trái

    isDragging = true;
    container.classList.add('dragging');

    const rect = container.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    container.style.bottom = 'auto';
    container.style.right = 'auto';
    container.style.left = `${initialLeft}px`;
    container.style.top = `${initialTop}px`;

    startX = e.clientX;
    startY = e.clientY;

    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Giới hạn trong khoảng màn hình
    const containerWidth = container.offsetWidth || 150;
    const containerHeight = container.offsetHeight || 150;
    const maxLeft = window.innerWidth - containerWidth;
    const maxTop = window.innerHeight - containerHeight;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      container.classList.remove('dragging');
    }
  });

  container.addEventListener('dragstart', (e) => e.preventDefault());

  window.addEventListener('resize', () => keepWidgetInBounds(container));
}

function keepWidgetInBounds(container) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const width = rect.width || container.offsetWidth || 150;
  const height = rect.height || container.offsetHeight || 150;

  if (container.style.left || container.style.top) {
    const maxLeft = Math.max(0, window.innerWidth - width);
    const maxTop = Math.max(0, window.innerHeight - height);

    let clampedLeft = Math.max(0, Math.min(rect.left, maxLeft));
    let clampedTop = Math.max(0, Math.min(rect.top, maxTop));

    container.style.left = `${clampedLeft}px`;
    container.style.top = `${clampedTop}px`;
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  }
}

function setState(newState) {
  if (currentState === newState) return;
  currentState = newState;
  widgetImg.src = ASSETS[newState];
}

// Logic to detect User Typing and Send
function setupUserTypingDetection() {
  const handleInputChange = (target) => {
    if (!target) return;
    if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const text = target.textContent || target.value || '';
      if (text.trim().length > 0) {
        if (currentState !== STATES.AI_THINKING && currentState !== STATES.AI_TYPING) {
          setState(STATES.USER_TYPING);
        }
      } else {
        // Xóa trắng input -> Trở về WAITING
        if (currentState !== STATES.AI_THINKING && currentState !== STATES.AI_TYPING) {
          setState(STATES.WAITING);
        }
      }
    }
  };

  // Listen to input & keyup (backspace/delete) events
  document.body.addEventListener('input', (e) => handleInputChange(e.target));
  document.body.addEventListener('keyup', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleInputChange(e.target);
    }
  });

  // Catch keydown for Enter (send)
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.target.isContentEditable || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        const text = e.target.textContent || e.target.value || '';
        if (text.trim().length > 0) {
          setState(STATES.AI_THINKING);
          startAITypingDetection();
        }
      }
    }
  }, true);

  // Catch click on send buttons
  document.body.addEventListener('click', (e) => {
     let target = e.target;
     while (target != null && target !== document.body) {
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            if (currentState === STATES.USER_TYPING) {
                setTimeout(() => {
                    let activeInput = document.querySelector('p[data-placeholder="Enter a prompt here"], div[contenteditable="true"], textarea');
                    let isEmpty = true;
                    if (activeInput) {
                        const text = activeInput.textContent || activeInput.value || "";
                        if (text.trim().length > 0) {
                            isEmpty = false;
                        }
                    } else {
                        const editables = document.querySelectorAll('div[contenteditable="true"], textarea');
                        for (let ed of editables) {
                            const text = ed.textContent || ed.value || "";
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


let typingTimeout;
let aiObserver;
let checkingAITyping = false;
let existingResponseElements = new Set();

// Lưu danh sách các khối câu trả lời đã tồn tại trong DOM trước khi prompt mới được gửi
function captureExistingResponses() {
  existingResponseElements.clear();
  const elements = document.querySelectorAll('model-response, .model-response, [data-test-id="model-response"], message-content, .message-content');
  elements.forEach((el) => existingResponseElements.add(el));
}

// Hàm kiểm tra cấu trúc DOM: chỉ trả về true khi thực sự có chữ được sinh ra trong khối trả lời MỚI (message-content/.markdown)
function isActualAnswerTextMutation(mutation) {
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

  // 1. Kiểm tra xem targetEl có thuộc về các khối trả lời ĐÃ TỒN TẠI TỪ TRƯỚC hay không
  for (let oldEl of existingResponseElements) {
    if (oldEl.contains(targetEl)) {
      return false; // Bỏ qua tất cả thay đổi thuộc các câu trả lời cũ
    }
  }

  // 2. Phải NẰM TRONG container chứa nội dung câu trả lời thật sự (message-content hoặc .markdown)
  const isInsideAnswerContainer = targetEl.closest('message-content, .message-content, .markdown, model-response .markdown');
  if (!isInsideAnswerContainer) return false;

  // 3. Phải KHÔNG NẰM TRONG khối suy nghĩ (Thought Viewer) hay khối tìm kiếm web (Grounding)
  const isInsideThinkingOrSearch = targetEl.closest('gdm-thought-viewer, thought-viewer, .thought-container, gdm-grounding-drawer, grounding-chips, .grounding-container, search-entry-point');
  if (isInsideThinkingOrSearch) return false;

  // 4. Phải chứa chữ thực sự
  const text = (targetEl.textContent || '').trim();
  return text.length > 0;
}

function startAITypingDetection() {
    captureExistingResponses();
    if (checkingAITyping) return;
    checkingAITyping = true;

    const targetContainer = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;

    aiObserver = new MutationObserver((mutations) => {
        let hasTextGeneration = false;

        for (let mutation of mutations) {
            if (isActualAnswerTextMutation(mutation)) {
                hasTextGeneration = true;
                break;
            }
        }

        if (hasTextGeneration) {
            if (currentState === STATES.AI_THINKING) {
                setState(STATES.AI_TYPING);
            }

            if (currentState === STATES.AI_TYPING) {
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    setState(STATES.AI_COMPLETE);
                    stopAITypingDetection();
                }, 1200);
            }
        }
    });

    aiObserver.observe(targetContainer, { childList: true, characterData: true, subtree: true });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
         if (currentState === STATES.AI_THINKING) {
             setState(STATES.WAITING);
             stopAITypingDetection();
         }
    }, 60000);
}

function stopAITypingDetection() {
    if (aiObserver) {
        aiObserver.disconnect();
        aiObserver = null;
    }
    checkingAITyping = false;
}

// Initialize
createWidget();
setupUserTypingDetection();


// Let's add an extra safety check. Sometimes we might miss the end of generation.
// Polling for UI states might be needed, but mutation observer with timeout is decent.
