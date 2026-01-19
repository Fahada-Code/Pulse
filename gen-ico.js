const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function convert() {
    try {
        const fn = pngToIco.default || pngToIco;
        const buf = await fn(path.join(__dirname, 'assets', 'icon.png'));
        fs.writeFileSync(path.join(__dirname, 'assets', 'icon.ico'), buf);
        console.log('Successfully generated assets/icon.ico');
    } catch (err) {
        console.error('Error generating ico:', err);
    }
}

convert();
