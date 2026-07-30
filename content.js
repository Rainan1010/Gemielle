console.log("Remielle Assistant Content Script Loaded");

// --- Initialization ---
const container = document.createElement('div');
container.id = 'remielle-assistant-container';

const img = document.createElement('img');
img.id = 'remielle-assistant-img';
container.appendChild(img);

document.body.appendChild(container);

// Helper function to get asset URL
function getAssetUrl(filename) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(`assets/${filename}`);
  }
  return `assets/${filename}`;
}

// Map states to GIF filenames
const GIFS = {
  waiting: getAssetUrl('waiting_user_input.gif'),
  typing: getAssetUrl('user_typing.gif'),
  thinking: getAssetUrl('ai_thingking.gif'),
  aiTyping: getAssetUrl('ai_typing.gif'),
  complete: getAssetUrl('ai_complete_answer.gif'),
};

let currentState = 'waiting';
function setGif(state) {
  if (currentState !== state && GIFS[state]) {
    console.log(`Transitioning to state: ${state}`);
    currentState = state;
    img.src = GIFS[state];
  }
}

setGif('waiting');

// --- Observers and Logic ---
let isWaitingForAiResponse = false;
let aiTypingDebounceTimer = null;

function attachInputListeners() {
  const inputEl = document.querySelector('rich-textarea') || document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
  
  if (!inputEl) {
    setTimeout(attachInputListeners, 1000);
    return;
  }

  if (inputEl.dataset.remielleAttached) return;
  inputEl.dataset.remielleAttached = "true";

  const checkInput = () => {
    if (isWaitingForAiResponse) return;

    let content = '';
    if (inputEl.tagName.toLowerCase() === 'textarea') {
      content = inputEl.value;
    } else {
      content = inputEl.textContent || inputEl.innerText;
    }

    if (content.trim().length > 0) {
      setGif('typing');
    } else {
      setGif('waiting');
    }
  };

  inputEl.addEventListener('input', checkInput);
  inputEl.addEventListener('focus', checkInput);
  inputEl.addEventListener('click', checkInput);
  
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleMessageSent();
    }
  });
}

document.addEventListener('click', (e) => {
    const button = e.target.closest('button[aria-label*="Send"], button[aria-label*="send"], button.send-button');
    if (button) {
        handleMessageSent();
    }
});

function handleMessageSent() {
    isWaitingForAiResponse = true;
    setGif('thinking');
}

const chatContainerObserver = new MutationObserver((mutations) => {
  if (!isWaitingForAiResponse) return;

  for (const mutation of mutations) {
      if (mutation.type === 'childList') {
          if (mutation.addedNodes.length > 0) {
              setGif('aiTyping');
              
              clearTimeout(aiTypingDebounceTimer);
              aiTypingDebounceTimer = setTimeout(() => {
                  setGif('complete');
                  isWaitingForAiResponse = false;
              }, 2000); 
          }
      } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          setGif('aiTyping');
          clearTimeout(aiTypingDebounceTimer);
          aiTypingDebounceTimer = setTimeout(() => {
              setGif('complete');
              isWaitingForAiResponse = false;
          }, 2000);
      }
  }
});

function startObservingChat() {
    const chatContainers = document.querySelectorAll('message-list, [role="log"], .conversation-container');
    let target = null;
    if (chatContainers.length > 0) {
        target = chatContainers[chatContainers.length - 1];
    } else {
        target = document.body;
    }
    
    chatContainerObserver.observe(target, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

setTimeout(() => {
    attachInputListeners();
    startObservingChat();
}, 2000);

const bodyObserver = new MutationObserver(() => {
    attachInputListeners();
});
bodyObserver.observe(document.body, { childList: true, subtree: true });