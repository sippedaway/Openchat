const socket = io('wss://chat.sipped.org');

let currentMessageFormat = "standard";
let chatMessages = [];

function log(message, inline = false) {
    const extraStyle = inline ? "" : "display:inline-block; padding: 10px;";
    const style = "color: white; background: black; font-family: monospace; font-size: 20px; " + extraStyle;
    console.log(`%c${message}`, style);
}

log("hey kitten");
log("looking through my code??");
log("go check out the repository:");
console.log('%chttps://www.github.com/sippedaway/Openchat', "font-size: 20px;");
log('have fun :) email me: hello@sipped.org');

function generateID(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

function formatTimestamp(timestampStr) {
    const date = new Date(timestampStr);
    const now = new Date();
    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    let displayTime;
    if (isToday) {
        displayTime =
            date.getHours().toString().padStart(2, '0') +
            ':' +
            date.getMinutes().toString().padStart(2, '0');
    } else {
        displayTime =
            (date.getMonth() + 1).toString().padStart(2, '0') +
            '/' +
            date.getDate().toString().padStart(2, '0');
    }

    const fullTime =
        date.getFullYear() +
        '-' +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        date.getDate().toString().padStart(2, '0') +
        ' ' +
        date.getHours().toString().padStart(2, '0') +
        ':' +
        date.getMinutes().toString().padStart(2, '0');

    return {
        displayTime,
        fullTime
    };
}

function renderMessage(data) {
    const {
        displayTime,
        fullTime
    } = formatTimestamp(data.fullTimestamp);

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    if (currentMessageFormat === "standard") {
        const header = document.createElement('div');
        header.classList.add('message-header');

        const usernameElem = document.createElement('strong');
        usernameElem.classList.add('username');
        usernameElem.textContent = data.username;

        const timestampElem = document.createElement('span');
        timestampElem.classList.add('timestamp');
        timestampElem.textContent = displayTime;
        timestampElem.setAttribute('data-tooltip', fullTime);

        header.appendChild(usernameElem);

        const timestamp = new Date(data.fullTimestamp);
        if (!isNaN(timestamp.getTime())) {
            header.appendChild(timestampElem);
        }

        const body = document.createElement('div');
        body.classList.add('message-body');
        body.textContent = data.message;

        messageElement.appendChild(header);
        messageElement.appendChild(body);
    } else if (currentMessageFormat === "compact") {
        messageElement.classList.add('compact');

        const usernameSpan = document.createElement('span');
        usernameSpan.classList.add('username');
        usernameSpan.innerHTML = `<b>${data.username}</b>`;

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = displayTime;
        timestampSpan.setAttribute('data-tooltip', fullTime);

        const messageSpan = document.createElement('span');
        messageSpan.classList.add('message-inline');
        messageSpan.textContent = data.message;

        messageElement.appendChild(usernameSpan);
        messageElement.appendChild(document.createTextNode(" "));

        const ctimestamp = new Date(data.fullTimestamp);
        if (!isNaN(ctimestamp.getTime())) {
            messageElement.appendChild(timestampSpan);
            messageElement.appendChild(document.createTextNode(" "));
        }

        messageElement.appendChild(messageSpan);
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function reRenderMessages() {
    chatBox.innerHTML = "";
    chatMessages.forEach((data) => {
        renderMessage(data);
    });
}

function updateTheme(textColor, bgColor) {
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--bg-color', bgColor);
    setCookie("themeTextColor", textColor, 30);
    setCookie("themeBgColor", bgColor, 30);
}

const usernameInput = document.getElementById('usernameInput');
const messageInput = document.getElementById('messageInput');
const messageForm = document.getElementById('messageForm');
const chatBox = document.getElementById('chatBox');

const defaultID = generateID();
let currentUsername = "Anonymous #" + defaultID;

const optionsButton = document.getElementById('optionsButton');
const optionsModal = document.getElementById('optionsModal');
const closeButton = document.querySelector('.close-button');
const tabItems = document.querySelectorAll('.modal-tabs ul li');
const themeTab = document.getElementById('themeTab');
const messageTab = document.getElementById('messageTab');

const messageFormatSelect = document.getElementById('messageFormatSelect');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontSizeValue = document.getElementById('fontSizeValue');

const formatButtons = document.querySelectorAll('.format-btn');
const themeButtons = document.querySelectorAll('.theme-btn');
const customTextColor = document.getElementById('customTextColor');
const customBgColor = document.getElementById('customBgColor');
const applyCustomTheme = document.getElementById('applyCustomTheme');

usernameInput.addEventListener('change', () => {
    if (usernameInput.value.trim() !== '') {
        currentUsername = usernameInput.value.trim();
    } else {
        currentUsername = "Anonymous #" + defaultID;
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message !== '') {
        const now = new Date();
        const data = {
            username: currentUsername,
            message: message,
            fullTimestamp: now.toISOString()
        };
        socket.emit('chat message', data);
        messageInput.value = '';
    }
});

socket.on('chat history', (history) => {
    chatMessages = history;
    reRenderMessages();
});

socket.on('chat message', (data) => {
    chatMessages.push(data);
    renderMessage(data);
});

socket.on('rate limit', (data) => {
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.textContent = data.error;
    chatBox.appendChild(errorElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

optionsButton.addEventListener('click', () => {
    optionsModal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
    optionsModal.style.display = 'none';
});

tabItems.forEach(item => {
    item.addEventListener('click', () => {
        tabItems.forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        if (tab === "theme") {
            themeTab.classList.add('active');
        } else if (tab === "message") {
            messageTab.classList.add('active');
        }
    });
});

themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const bg = btn.getAttribute('data-bg');
        updateTheme(text, bg);
    });
});

applyCustomTheme.addEventListener('click', () => {
    const text = customTextColor.value;
    const bg = customBgColor.value;
    updateTheme(text, bg);
});

formatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-value');
        currentMessageFormat = text;
        reRenderMessages();
        setCookie("messageFormat", currentMessageFormat, 30);
    });
});

fontSizeInput.addEventListener('input', () => {
    const size = fontSizeInput.value;
    fontSizeValue.textContent = `${size}px`;
    chatBox.style.fontSize = `${size}px`;
    setCookie("chatFontSize", size, 30);
});

window.addEventListener('click', (e) => {
    if (e.target === optionsModal) {
        optionsModal.style.display = 'none';
    }
});

window.addEventListener('load', () => {
    const savedTextColor = getCookie("themeTextColor");
    const savedBgColor = getCookie("themeBgColor");
    if (savedTextColor && savedBgColor) {
        updateTheme(savedTextColor, savedBgColor);
    }

    const savedFormat = getCookie("messageFormat");
    if (savedFormat) {
        currentMessageFormat = savedFormat;
        messageFormatSelect.value = savedFormat;
        reRenderMessages();
    }

    const savedFontSize = getCookie("chatFontSize");
    if (savedFontSize) {
        fontSizeInput.value = savedFontSize;
        fontSizeValue.textContent = `${savedFontSize}px`;
        chatBox.style.fontSize = `${savedFontSize}px`;
    }
});

window.onload = function() {
    const popupShown = getCookie('popupShown');

    if (!popupShown) {
        document.getElementById('warningPopup').style.display = 'flex';

        setCookie('popupShown', 'true', 365);
    }
};

function closePopup() {
    document.getElementById('warningPopup').style.display = 'none';
}

window.addEventListener('click', function(event) {
    const popup = document.getElementById('warningPopup');
    const popupContent = document.querySelector('.popup-content');

    if (event.target === popup) {
        closePopup();
    }
});
