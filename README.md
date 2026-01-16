# Pulse - YouTube Music Controller

Pulse is a desktop widget that allows you to control YouTube Music from your desktop. It stays on top of other windows so you can easily manage your music while working or gaming.

## Features

Pulse provides a persistent overlay that remains visible over other applications. It includes a dynamic visualizer and borders that react to the music currently playing. You can switch to a mini mode for a more compact interface. The widget allows for direct control over playback, including volume adjustments and seeking. It also automatically pauses the music when the application is closed.

## Installation

To set up the desktop application for development, run the following commands in your terminal:

npm install
npm start

To build a standalone executable for the application, use:

npm run dist

The output will be located in the dist folder.

To set up the browser extension, open Chrome and navigate to the extensions page. Enable developer mode and use the option to load an unpacked extension, selecting the folder named extension in this project.

## Usage

Once both the application and extension are set up, open YouTube Music in your browser. The Pulse widget will connect automatically and display track information. You can use the on-screen buttons to play, pause, skip, or adjust the volume.

## Troubleshooting

If the widget displays a disconnected message, verify that the YouTube Music tab is open and the extension is active. If the visualizer is not moving, click once anywhere on the widget to enable the audio context as required by browser security.
