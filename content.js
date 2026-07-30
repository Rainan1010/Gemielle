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
}

function setState(newState) {
  if (currentState === newState) return;
  currentState = newState;
  widgetImg.src = ASSETS[newState];
}

// Logic to detect User Typing and Send
function setupUserTypingDetection() {
  // Gemini uses a contenteditable div or textarea. We will listen to events on the body and delegate.
  document.body.addEventListener('input', (e) => {
    // Only care about editable elements
    if (e.target.isContentEditable || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
      const text = e.target.textContent || e.target.value;
      if (text.trim().length > 0) {
        if (currentState !== STATES.AI_THINKING && currentState !== STATES.AI_TYPING) {
             setState(STATES.USER_TYPING);
        }
      } else {
        if (currentState !== STATES.AI_THINKING && currentState !== STATES.AI_TYPING) {
             setState(STATES.WAITING);
        }
      }
    }
  });

  // Also catch keydown for enter (send)
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        // Simple heuristic: if we press enter on an editable element with text, we assume send.
        if (e.target.isContentEditable || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            const text = e.target.textContent || e.target.value;
            if (text.trim().length > 0) {
                 // Trigger thinking state
                 setState(STATES.AI_THINKING);
                 startAITypingDetection();
            }
        }
    }
  }, true); // use capture

  // Try to catch click on send buttons.
  // Gemini might use <button> or something with role="button" or an icon.
  document.body.addEventListener('click', (e) => {
     // If we click a button while user typing, it might be a send.
     // It's hard to precisely identify the send button without specific selectors.
     let target = e.target;
     while (target != null && target !== document.body) {
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            if (currentState === STATES.USER_TYPING) {
                // Instead of assuming any button click is a send, we wait a moment.
                // If it was a send button, the chat input should be cleared shortly after.
                // If it was just a model selector or other button, the text will remain.
                setTimeout(() => {
                    // Try to find the active editable element
                    let activeInput = document.querySelector('p[data-placeholder="Enter a prompt here"], div[contenteditable="true"], textarea');

                    let isEmpty = true;
                    if (activeInput) {
                        const text = activeInput.textContent || activeInput.value || "";
                        if (text.trim().length > 0) {
                            isEmpty = false;
                        }
                    } else {
                        // If we can't find the input, check if we are still in USER_TYPING state
                        // and assume it might have been sent if we have a way to verify later.
                        // For now, if we can't find it, we'll cautiously proceed but ideally we find it.
                        // A more robust way is just checking all contenteditables.
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
                }, 200); // 200ms delay to allow UI to clear input
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

function startAITypingDetection() {
    if (checkingAITyping) return;
    checkingAITyping = true;

    // We observe DOM changes. If DOM changes significantly (new elements added), it might be AI typing.
    aiObserver = new MutationObserver((mutations) => {
        let significantChange = false;
        for (let mutation of mutations) {
            // Gemini streams text. It usually adds text nodes or small elements.
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                significantChange = true;
                break;
            }
        }

        if (significantChange) {
            if (currentState === STATES.AI_THINKING) {
                setState(STATES.AI_TYPING);
            }

            if (currentState === STATES.AI_TYPING) {
                // reset timeout
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    // No more DOM changes for a while, assume complete.
                    setState(STATES.AI_COMPLETE);
                    stopAITypingDetection();
                }, 2000); // 2 seconds of no DOM change means complete
            }
        }
    });

    // Observe body for changes.
    // It's a bit heavy, but without knowing the exact container, it's a generic way.
    aiObserver.observe(document.body, { childList: true, characterData: true, subtree: true });

    // Set a fallback timeout in case DOM doesn't change after "Thinking" (e.g. error, or fast response)
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
         if (currentState === STATES.AI_THINKING) {
             // Maybe it didn't type, just finished? Or failed. Let's just go back to waiting.
             setState(STATES.WAITING);
             stopAITypingDetection();
         }
    }, 15000); // 15 seconds max for thinking
}

function stopAITypingDetection() {
    if (aiObserver) {
        aiObserver.disconnect();
    }
    checkingAITyping = false;
}

// Initialize
createWidget();
setupUserTypingDetection();

// Let's add an extra safety check. Sometimes we might miss the end of generation.
// Polling for UI states might be needed, but mutation observer with timeout is decent.
