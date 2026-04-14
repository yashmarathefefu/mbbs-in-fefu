const fs = require('fs');
const https = require('https');
const html = fs.readFileSync('e:\\final website\\gallery.html', 'utf8');
const regex = /src=\"(https:\/\/ibspwomnrilukdcumsix\.supabase\.co\/[^\"]+)\"/g;
let match;
const urls = [];
while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
}
console.log('Found ' + urls.length + ' urls');

let activeRequests = 0;
urls.forEach(url => {
    activeRequests++;
    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            console.log('FAILED: ' + res.statusCode + ' - ' + url);
        }
        activeRequests--;
    }).on('error', (e) => {
        console.log('ERROR: ' + e.message + ' - ' + url);
        activeRequests--;
    });
});

const waitInterval = setInterval(() => {
    if (activeRequests === 0) {
        console.log('Done checking.');
        clearInterval(waitInterval);
    }
}, 500);
