// Configuration
const config = {
    buttonColor: 'text-token-text-primary',
    activeColor: 'text-red-500',
    buttonStyle: 'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
    buttonHover: 'hover:bg-token-main-surface-secondary',
    recordingAnimation: 'recording-pulse',
    recordingBackground: 'bg-red-100'
};

// Add CSS animation for the recording state
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .recording-pulse {
        animation: pulse 2s infinite ease-in-out;
    }
`;
document.head.appendChild(style);

// Speech recognition setup
let recognition = null;
let isListening = false;
let observer = null;

function initializeSpeechRecognition(button) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let accumulatedTranscript = "";

        // Add event listener for Enter key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                // Reset accumulated transcript and recognition
                accumulatedTranscript = "";
            }
        });

        recognition.onresult = (event) => {
            let currentFinal = "";
            let currentInterim = "";
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentFinal += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }

            // Add any new final transcript to accumulated
            if (currentFinal) {
                accumulatedTranscript += currentFinal;
            }

            const editor = document.querySelector('.ProseMirror');
            if (editor) {
                // Show accumulated transcript plus any current interim results
                editor.textContent = accumulatedTranscript + currentInterim;
                const inputEvent = new Event('input', { bubbles: true });
                editor.dispatchEvent(inputEvent);
            }
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            updateButtonState(button);
        };

        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isListening) {
                recognition.start();
                isListening = true;
            } else {
                recognition.stop();
                isListening = false;
            }
            updateButtonState(button);
        });
    }
}

function createMicButton() {
    const micButton = document.createElement('button');
    micButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 512 512" fill="none" class="${config.buttonColor}">
            <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z" fill="currentColor"/>
            <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z" fill="currentColor"/>
        </svg>
    `;
    micButton.className = config.buttonStyle;
    micButton.setAttribute('aria-label', 'Voice input');
    micButton.dataset.extensionMic = "true";
    return micButton;
}

function ensureMicButtonExists() {
    // Find the container that holds all the control buttons
    const controlsContainer = document.querySelector('.flex.gap-x-1:has([data-testid="composer-speech-button"])');
    if (!controlsContainer) return;

    // Check if our button already exists
    let micButton = controlsContainer.querySelector('[data-extension-mic="true"]');
    
    if (!micButton) {
        micButton = createMicButton();
        // Add as first child of the controls container
        controlsContainer.prepend(micButton);
        initializeSpeechRecognition(micButton);
    }
}

function updateButtonState(button) {
    if (isListening) {
        button.classList.remove(config.buttonColor);
        button.classList.remove(config.buttonHover);
        button.classList.add(config.activeColor);
        button.classList.add(config.recordingAnimation);
        button.classList.add(config.recordingBackground);
    } else {
        button.classList.add(config.buttonColor);
        button.classList.add(config.buttonHover);
        button.classList.remove(config.activeColor);
        button.classList.remove(config.recordingAnimation);
        button.classList.remove(config.recordingBackground);
    }
}

// Initialize observer
function initObserver() {
    observer = new MutationObserver((mutations) => {
        ensureMicButtonExists();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ensureMicButtonExists();
        initObserver();
    });
} else {
    ensureMicButtonExists();
    initObserver();
}