const clc = require('cli-color');
const error = message => clc.red.bold('(⬣) ' + message);
const info = message => clc.cyan.bold('(i) ' + message);
const success = message => clc.green.bold('(✓) ' + message);

const { chromium } = require('playwright');
const fs = require('fs');

async function extractCoordinatesAndZoom(url) {
    const regex = /@([-+]?\d*\.\d+),([-+]?\d*\.\d+),(\d+)z/i;
    const match = url.match(regex);
    if (match) {
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);
        const zoom = 15; // Always use maximum zoom (15)
        return { latitude, longitude, zoom };
    }
    return { latitude: null, longitude: null, zoom: null };
}

async function crawl(SEARCH_TERM) {
    const browser = await chromium.launch({ headless: false });
    const dataArray = [];

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log(info('Opening Google Maps...'));
        const initialUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(SEARCH_TERM);
        await page.goto(initialUrl);

        let isCompleted = false;

        while (!isCompleted) {
            await page.waitForTimeout(10 * 1000);

            const currentUrl = await page.url();

            const { latitude, longitude, zoom } = await extractCoordinatesAndZoom(currentUrl);

            if (!latitude || !longitude || !zoom) {
                console.error(error('Invalid URL format. Unable to extract coordinates and zoom level.'));
                break;
            }

            console.log(info(`Crawling for coordinates: ${latitude}, ${longitude}, Zoom: ${zoom}`));

            const rows = 2; // Number of rows
            const columns = 2; // Number of columns
            const totalArea = 0.2 * 0.2; // Total area

            const chunkSize = Math.sqrt(totalArea / (rows * columns));

            const latChunks = Math.ceil(0.2 / chunkSize);
            const longChunks = Math.ceil(0.2 / chunkSize);

            for (let latChunk = 0; latChunk < latChunks; latChunk++) {
                for (let longChunk = 0; longChunk < longChunks; longChunk++) {
                    const chunkLatitude = latitude + latChunk * chunkSize;
                    const chunkLongitude = longitude + longChunk * chunkSize;
                    const totalChunks = latChunks * longChunks;
                    const currentChunk = latChunk * longChunks + longChunk + 1;

                    console.log(info(`Crawling chunk ${currentChunk}/${totalChunks}: Latitude: ${chunkLatitude}, Longitude: ${chunkLongitude}, Zoom: ${zoom}`));

                    const chunkUrl = `https://www.google.com/maps/search/${encodeURIComponent(SEARCH_TERM)}/@${chunkLatitude},${chunkLongitude},${zoom}z`;
                    await page.goto(chunkUrl);

                    console.log(info('Scrolling to the bottom...'));
                    await page.evaluate(() => {
                        const feed = document.querySelector('div[role="feed"]');
                        feed.scrollTop = feed.scrollHeight;
                    });

                    await page.waitForTimeout(2000);

                    const elementsToClick = await page.$$('.hfpxzc');
                    for (let i = 0; i < elementsToClick.length; i++) {
                        const element = elementsToClick[i];
                        const isElementAttached = await element.evaluate(element => !!element);

                        if (!isElementAttached) {
                            console.log(info('Element is not attached, skipping...'));
                            continue;
                        }

                        await element.click();
                        await page.waitForSelector('div[role="main"]', { timeout: 5000 });

                        const extractedData = await page.evaluate(() => {
                            const nameElement = document.querySelector('div[role="main"] h1.DUwDvf');
                            const categoryElement = document.querySelector('div[role="main"] button.DkEaL');
                            const addressElement = document.querySelector('button[data-item-id="address"] .Io6YTe');
                            const phoneElement = document.querySelector('div[role="main"] button[data-item-id="phone"] .Io6YTe');

                            return {
                                name: nameElement ? nameElement.textContent : null,
                                category: categoryElement ? categoryElement.textContent : null,
                                address: addressElement ? addressElement.textContent : null,
                                phone: phoneElement ? phoneElement.textContent : null,
                                zipCode: null,
                            };
                        });

                        if (extractedData.name && extractedData.address) {
                            const zipCodeMatch = extractedData.address.match(/\b\d{5}(?:-\d{4})?\b/);
                            extractedData.zipCode = zipCodeMatch ? zipCodeMatch[0] : "No Zip Code Found";
                            console.log(success('Extracted Data:'), extractedData);
                            dataArray.push(extractedData);
                        } else {
                            console.log(info('Not Saving:'), extractedData);
                        }

                        await page.waitForTimeout(1500);
                    }

                    console.log(info('Scrolling back to the top...'));
                    await page.evaluate(() => {
                        const feed = document.querySelector('div[role="feed"]');
                        feed.scrollTop = 0;
                    });

                    console.log(info('Waiting for a moment...'));
                    await page.waitForTimeout(2000);
                }
                isCompleted = true;
            }
        }
    } catch (crawlError) {
        console.error(error('Error during crawl:'), crawlError);
    } finally {
        console.log(info('Closing the browser...'));
        await browser.close();

        // Write the JSON file and quit
        const outputFileName = `./json/${SEARCH_TERM.replace(' ', '_')}.json`;
        fs.writeFileSync(outputFileName, JSON.stringify(dataArray, null, 2));
        console.log(success('Data written to', outputFileName));
    }

    return dataArray;
}

module.exports = crawl;