const fs = require('fs');
const https = require('https');
const path = require('path');

const galleryPath = path.join(__dirname, 'gallery.html');
const html = fs.readFileSync(galleryPath, 'utf8');
const regex = /src="(https:\/\/ibspwomnrilukdcumsix\.supabase\.co\/[^"]+)"/g;
const urls = [...html.matchAll(regex)].map((match) => match[1]);

if (urls.length === 0) {
    console.error(`No Supabase image URLs found in ${galleryPath}.`);
    process.exit(1);
}

console.log(`Found ${urls.length} urls`);

let activeRequests = urls.length;
let failed = false;

urls.forEach((url) => {
    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            failed = true;
            console.error(`FAILED: ${res.statusCode} - ${url}`);
        }
        res.resume();
        activeRequests -= 1;
    }).on('error', (error) => {
        failed = true;
        console.error(`ERROR: ${error.message} - ${url}`);
        activeRequests -= 1;
    });
});

const waitInterval = setInterval(() => {
    if (activeRequests !== 0) {
        return;
    }

    clearInterval(waitInterval);
    if (failed) {
        process.exit(1);
    }

    console.log('Done checking.');
}, 250);
