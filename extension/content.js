console.log('Pulse: Content Script Loaded v1.1');

class PulseConnector {
    constructor() {
        this.lastState = {};
        this.observer = null;
        this.updateInterval = null;
        this.keepAliveInterval = null;
        this.init();
    }

    init() {
        // Watch playback changes
        this.observer = new MutationObserver(() => {
            this.checkForUpdates();
        });

        const playerBar = document.querySelector('ytmusic-player-bar');
        if (playerBar) {
            this.observer.observe(playerBar, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
            console.log('Pulse: Observer attached to player bar');
        } else {
            console.log('Pulse: Player bar not found, retrying in 1s');
            setTimeout(() => this.init(), 1000);
            return;
        }

        // Periodic check
        this.updateInterval = setInterval(() => this.checkForUpdates(), 1000);

        // SW keep-alive
        this.keepAliveInterval = setInterval(() => {
            // Keep alive
            try {
                void chrome.runtime.sendMessage({ type: 'KEEP_ALIVE' }).catch(() => { });
            } catch (e) {
                this.handleContextInvalidated(e);
            }
        }, 10000);
    }

    handleContextInvalidated(e) {
        if (e.message.includes('Extension context invalidated')) {
            console.log('Pulse: Context invalidated. Stopping polling.');
            if (this.updateInterval) clearInterval(this.updateInterval);
            if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
            if (this.observer) this.observer.disconnect();
        }
    }

    checkForUpdates() {
        try {
            const state = this.getPlayerState();

            // Avoid spam
            if (JSON.stringify(state) !== JSON.stringify(this.lastState)) {
                this.lastState = state;
                this.sendUpdate(state);
            }
        } catch (e) {
            this.handleContextInvalidated(e);
        }
    }

    getPlayerState() {
        // Try selectors
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

        let artist = getText(['ytmusic-player-bar .byline', '.content-info-wrapper .subtitle', '.content-info-wrapper .byline']);
        if (artist) {
            // Clean artist
            artist = artist.split('•')[0].trim();
        } else {
            artist = 'Unknown Artist';
        }

        const albumArt = getSrc(['ytmusic-player-bar .image', '.thumbnail-image-wrapper img', '#img']) || '';

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
        // Send to bg
        try {
            chrome.runtime.sendMessage({ type: 'TRACK_UPDATE', data });
        } catch (e) {
            // Extension reloaded?
            console.log('Pulse: Failed to send update', e);
        }
    }

    // Controls
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

// Init
const pulse = new PulseConnector();

// Listen for commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'COMMAND') {
        const cmd = request.command;
        // Support string 'play' or object { action: 'setVolume', value: 50 }
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
