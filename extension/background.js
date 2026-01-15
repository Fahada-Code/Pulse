let socket = null;
let reconnectInterval = null;
let keepAliveInterval = null;

// --- WEBSOCKET CONNECTION ---
// We connect to the local Electron app (Server) to send/receive updates.
function connect() {
    // console.log('Pulse: Connecting to Desktop App...');
    socket = new WebSocket('ws://localhost:8999');

    socket.onopen = () => {
        // console.log('Pulse: Connected!');

        // Stop retrying if we were in a reconnect loop
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }

        // Start Heartbeat: Ping the server every 10s to keep the connection alive
        // This is crucial to prevent the Service Worker from going to sleep.
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        keepAliveInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'PING' }));
            }
        }, 10000);
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);

            // --- INCOMING COMMANDS ---
            // The desktop app sent us a command (Play, Pause, Volume, etc.)
            if (message.type === 'COMMAND') {
                // Find the YouTube Music tab and pass the command along
                chrome.tabs.query({ url: 'https://music.youtube.com/*' }, (tabs) => {
                    if (tabs.length > 0) {
                        tabs.forEach((tab) => {
                            chrome.tabs.sendMessage(tab.id, message).catch(err => {
                                // Sometimes tabs are mid-reload and can't receive messages
                                console.log('Pulse: Could not send command to tab', tab.id);
                            });
                        });
                    }
                    // Fallback: If no tab is open and the user pressed Play/Next/Prev, open YTM for them.
                    else if (typeof message.command === 'string' && ['play', 'next', 'prev'].includes(message.command)) {
                        chrome.tabs.create({ url: 'https://music.youtube.com' });
                    }
                });
            }
        } catch (e) {
            console.error('Pulse: Failed to process incoming message', e);
        }
    };

    socket.onclose = () => {
        // console.log('Pulse: Disconnected. Retrying in 3s...');
        socket = null;

        // Clean up intervals
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
        }

        // Try to reconnect if we aren't already trying
        if (!reconnectInterval) {
            reconnectInterval = setInterval(connect, 3000);
        }
    };

    socket.onerror = (error) => {
        console.error('Pulse: WebSocket Error', error);
        // Safe close. This triggers onclose, which handles the retry logic.
        if (socket) socket.close();
    };
}

// Kick it off
connect();

// --- CONTENT SCRIPT COMMUNICATION ---
// Listen for updates from content.js (Song info) and forward them to the desktop app.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRACK_UPDATE') {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'TRACK_UPDATE', data: request.data }));
        } else if (!socket || socket.readyState !== WebSocket.OPEN) {
            // If we lost connection, try to reconnect immediately
            connect();
        }
    }
    // This message is just to wake up the Service Worker
    else if (request.type === 'KEEP_ALIVE') {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connect();
        }
    }
});
