(function () {
  if (window.GemielleWidget) return;

  const ASSETS = {
    WAITING: chrome.runtime.getURL('assets/waiting_user_input.gif'),
    USER_TYPING: chrome.runtime.getURL('assets/user_typing.gif'),
    AI_THINKING: chrome.runtime.getURL('assets/ai_thingking.gif'),
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
    if (document.getElementById('gemini-ai-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'gemini-ai-widget-container';

    widgetImg = document.createElement('img');
    widgetImg.src = ASSETS[currentState];
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
      if (e.button !== 0) return;

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
    if (!STATES[newState]) return;
    if (currentState === newState) return;
    currentState = newState;
    if (widgetImg) {
      widgetImg.src = ASSETS[newState];
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  window.GemielleWidget = {
    STATES,
    setState,
    getState: () => currentState
  };
})();
