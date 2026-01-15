// Pulse Content Script v1.2
// This script runs inside YouTube Music to scrape data and control the player.
console.log('Pulse: Content Script Loaded');

class PulseConnector {
    constructor() {
        this.lastState = {};
        this.observer = null;
        this.updateInterval = null;
        this.keepAliveInterval = null;
        this.init();
    }

    init() {
        // --- MUTATION OBSERVER ---
        // We watch the player bar for any DOM changes (song change, play/pause).
        this.observer = new MutationObserver(() => {
            this.checkForUpdates();
        });

        const playerBar = document.querySelector('ytmusic-player-bar');

        // Sometimes the player bar isn't loaded yet, so we retry.
        if (playerBar) {
            this.observer.observe(playerBar, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
            // console.log('Pulse: Watching player events...');
        } else {
            // console.log('Pulse: Waiting for player...');
            setTimeout(() => this.init(), 1000);
            return;
        }

        // --- BACKUP POLLING ---
        // Observers can miss some state changes (like time updates), so we poll every second too.
        this.updateInterval = setInterval(() => this.checkForUpdates(), 1000);

        // --- KEEP ALIVE ---
        // Sends a dummy message to the background script to keep the Service Worker awake.
        this.keepAliveInterval = setInterval(() => {
            try {
                void chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }).catch(() => { });
            } catch (e) {
                // If the extension context is invalidated (updated/reloaded), we must stop to prevent errors.
                this.handleContextInvalidated(e);
            }
        }, 10000);
    }

    // Safety check: deeply cleans up if the extension was reloaded in the background.
    handleContextInvalidated(e) {
        if (e.message.includes('Extension context invalidated')) {
            console.log('Pulse: Extension reloaded. Stopping old script.');
            if (this.updateInterval) clearInterval(this.updateInterval);
            if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
            if (this.observer) this.observer.disconnect();
        }
    }

    checkForUpdates() {
        try {
            const state = this.getPlayerState();

            // Only send an update if something actually changed (save bandwidth/performance)
            if (JSON.stringify(state) !== JSON.stringify(this.lastState)) {
                this.lastState = state;
                this.sendUpdate(state);
            }
        } catch (e) {
            this.handleContextInvalidated(e);
        }
    }

    // --- DATA EXTRACTION ---
    // Scrapes the DOM for title, artist, art, and checks the video element for status.
    getPlayerState() {
        // Helper to try multiple selectors (YouTube changes class names often)
        const getText = (selectors) => {
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText.trim()) return el.innerText;
            }
            return null;
        };

        const getSrc = (selectors) => {
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.src) return el.src;
            }
            return null;
        };

        const title = getText(['ytmusic-player-bar .title', '.content-info-wrapper .title', 'yt-formatted-string.title']) || 'Unknown Title';

        // Artist often has "• Album Name" appended, so we split and take the first part.
        let artist = getText(['ytmusic-player-bar .byline', '.content-info-wrapper .subtitle', '.content-info-wrapper .byline']);
        if (artist) {
            artist = artist.split('•')[0].trim();
        } else {
            artist = 'Unknown Artist';
        }

        const albumArt = getSrc(['ytmusic-player-bar .image', '.thumbnail-image-wrapper img', '#img']) || '';

        // The <video> element is the source of truth for playback state.
        const videoElement = document.querySelector('video');
        const isPlaying = videoElement ? !videoElement.paused : false;
        const volume = videoElement ? Math.round(videoElement.volume * 100) : 100;
        const isMuted = videoElement ? videoElement.muted : false;

        // console.log('Pulse Debug:', { title, artist, albumArt, isPlaying, volume, isMuted });

        return {
            title,
            artist,
            albumArt,
            isPlaying,
            volume,
            isMuted
        };
    }

    sendUpdate(data) {
        try {
            chrome.runtime.sendMessage({ type: 'TRACK_UPDATE', data });
        } catch (e) {
            this.handleContextInvalidated(e);
            console.log('Pulse: Failed to send update', e);
        }
    }

    // --- PLAYER CONTROLS ---

    playPause() {
        const playButton = document.querySelector('#play-pause-button');
        if (playButton) playButton.click();
    }

    next() {
        const nextButton = document.querySelector('.next-button');
        if (nextButton) nextButton.click();
    }

    previous() {
        const prevButton = document.querySelector('.previous-button');
        if (prevButton) prevButton.click();
    }

    setVolume(val) {
        const video = document.querySelector('video');
        if (video) {
            video.volume = val / 100;
            // If user drags slider up, assume they want to unmute.
            if (val > 0 && video.muted) video.muted = false;
        }
    }

    toggleMute() {
        const video = document.querySelector('video');
        if (video) {
            video.muted = !video.muted;
        }
    }

    seek(seconds) {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime += seconds;
        }
    }
}

// Start the engine
const pulse = new PulseConnector();

// --- COMMAND LISTENER ---
// Listen for commands from the extension background script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'COMMAND') {
        const cmd = request.command;
        // Commands can be simple strings ('play') or objects ({ action: 'seek', value: 10 })
        const action = typeof cmd === 'string' ? cmd : cmd.action;

        switch (action) {
            case 'play':
            case 'pause':
                pulse.playPause();
                break;
            case 'next':
                pulse.next();
                break;
            case 'prev':
                pulse.previous();
                break;
            case 'toggleMute':
                pulse.toggleMute();
                break;
            case 'setVolume':
                pulse.setVolume(cmd.value);
                break;
            case 'seek':
                pulse.seek(cmd.value);
                break;
        }
    }
});
