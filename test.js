const crawl = require('./index');
const fs = require('fs');

async function main() {

    let categories = fs.readFileSync('./categories.txt', 'utf8').split('\r\n');

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        let results = await crawl(category + ' in New Jersey, United States Of America');
        console.log("--------------------------------");
        console.log(`Found ${results.length} for '${category} in New Jersey, United States Of America'`)
        console.log("--------------------------------");
    }


}

main();