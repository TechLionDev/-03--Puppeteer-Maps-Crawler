const crawl = require('./index');
const fs = require('fs');

async function main() {

    let sum = 0;

    let categories = fs.readFileSync('./categories.txt', 'utf8').split('\r\n');
    let zipcodes = fs.readFileSync('./zipcodes.txt', 'utf8').split('\r\n');


    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
       for (let j = 0; j < zipcodes.length; j++) {
        const zipcode = zipcodes[j];
        console.log(`${category} ${zipcode}`);
         let results = await crawl(category + ' ' + zipcode);
        console.log("--------------------------------");
        console.log(`Found ${results.length} for '${category} ${zipcode}'`);
        console.log("--------------------------------");
        sum += results.length;
       }
    }
    console.log("--------------------------------");
    console.log(`Found ${sum} results`)
    console.log("--------------------------------");

}

main();