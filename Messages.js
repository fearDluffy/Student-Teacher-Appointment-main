const messageInput = document.getElementById('Message');
const sendButton = document.getElementById('sendButton');
const chatContainer = document.getElementById('chatContainer');

if (sendButton && messageInput && chatContainer) {
    sendButton.addEventListener('click', () => {
        const messageText = messageInput.value.trim();

        if (messageText) {
            const messageElement = document.createElement('div');
            messageElement.className = 'Text-Container ml-auto mr-2 mb-2';

            const messageP = document.createElement('p');
            messageP.className = 'Messages-Text';
            messageP.textContent = messageText;

            messageElement.appendChild(messageP);
            chatContainer.appendChild(messageElement);

            messageInput.value = '';
        }
    });
} else {
    console.log("One or more elements not found.");
}
