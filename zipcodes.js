const crawl = require('./index');
const fs = require('fs');

async function main() {
    let codes = fs.readFileSync('zipcodes.txt', 'utf8').split('\r\n');

    for (let i = 0; i < codes.length; i++) {
        console.log(`Crawling Stores in Zip code ${i}. ${codes[i]}`);
        await crawl(`Stores in ${codes[i]}`);
    }
}

main()