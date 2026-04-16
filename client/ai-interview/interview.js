const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearChat = document.getElementById('clearChat');

let chatHistory = [];

// API Configuration
const API_URL = '/api/ai/chat';

function createMessageElement(content, isAi = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
    return messageDiv;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to UI
    chatMessages.appendChild(createMessageElement(message, false));
    userInput.value = '';
    userInput.style.height = 'auto';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to history
    chatHistory.push({ role: 'user', content: message });

    // Show indicator
    showTypingIndicator();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: chatHistory.slice(0, -1) }) // Pass history excluding current message
        });

        const data = await response.json();

        // Remove indicator
        removeTypingIndicator();

        if (data.reply) {
            chatMessages.appendChild(createMessageElement(data.reply, true));
            chatHistory.push({ role: 'ai', content: data.reply });
        } else {
            chatMessages.appendChild(createMessageElement('Sorry, I encountered an error. Please try again.', true));
        }
    } catch (error) {
        removeTypingIndicator();
        console.error('Chat Error:', error);
        chatMessages.appendChild(createMessageElement('Connection error. Is the server running?', true));
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

clearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    chatHistory = [];
    chatMessages.appendChild(createMessageElement('Session cleared. How can I help you now?', true));
});
