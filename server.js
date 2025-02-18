const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const RATE_LIMIT_MS = 300;
const userLastMessage = {};

const messages = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.emit('chat history', messages);

    socket.on('chat message', (data) => {
        const now = Date.now();
        if (!userLastMessage[socket.id]) {
            userLastMessage[socket.id] = 0;
        }
        if (now - userLastMessage[socket.id] < RATE_LIMIT_MS) {
            socket.emit('rate limit', {
                error: 'Please wait before sending another message.'
            });
            return;
        }
        userLastMessage[socket.id] = now;

        messages.push(data);

        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete userLastMessage[socket.id];
    });
});

module.exports = app;

http.listen(PORT, () => {
    console.log(`Server is running :)`);
});