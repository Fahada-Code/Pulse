const fs = require('fs');
const pngToIco = require('png-to-ico');
const convert = pngToIco.default;

console.log('Generating ICO from PNG...');

convert('assets/icon.png')
    .then(buf => {
        fs.writeFileSync('assets/icon.ico', buf);
        console.log('Successfully created assets/icon.ico');
    })
    .catch(console.error);
