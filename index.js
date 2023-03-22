// run `node index.js` in the terminal

import lighthouse from "lighthouse";
import chromeLauncher from "chrome-launcher";

import fs from "fs";

const runLighthouse = async (url) => {
  const chrome = await chromeLauncher.launch();
  const options = {
    port: chrome.port,
    emulatedFormFactor: "desktop", // Configure Lighthouse for desktop mode
    screenEmulation: {
      width: 1336,
      height: 720,
      deviceScaleFactor: 1,
      disabled: true,
      mobile: false,
    },
    extraHeaders: {
      // Example headers you can pass to set a specific viewport size
      "Content-Type": "text/html",
      "Viewport-Width": "1336",
      "Viewport-Height": "720",
    },
  };
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  return runnerResult.lhr;
};

const compareReports = async (url1, url2) => {
  const report1 = await runLighthouse(url1);
  const report2 = await runLighthouse(url2);
  const results = {
    url1: { FCP: null, CLS: null, SI: null, TTI: null, TBT: null, LCP: null },
    url2: { FCP: null, CLS: null, SI: null, TTI: null, TBT: null, LCP: null },
  };

  // Get CLS, SI, and LCP for URL1
  const data1 = report1.audits;
  const data2 = report2.audits;
  const filename1 = "audits1.json";
  const filename2 = "audits2.json";
  try {
    fs.writeFileSync(filename1, JSON.stringify(data1), (err) => {
      if (err) throw err;
      console.log(`Audits data written to ${filename1}`);
    });
    fs.writeFileSync(filename2, JSON.stringify(data2), (err) => {
      if (err) throw err;
      console.log(`Audits data written to ${filename1}`);
    });
  } catch (err) {
    console.log("error on fs statement", err);
  }

  results.url1.FCP = data1["first-contentful-paint"].numericValue;
  results.url1.SI = data1["speed-index"].numericValue;
  results.url1.LCP = data1["largest-contentful-paint"].numericValue;
  results.url1.TTI = data1["interactive"].numericValue;
  results.url1.TBT = data1["total-blocking-time"].numericValue;
  results.url1.CLS = data1["cumulative-layout-shift"].numericValue;

  // Get CLS, SI, and LCP for URL2
  results.url2.FCP = data2["first-contentful-paint"].numericValue;
  results.url2.SI = data2["speed-index"].numericValue;
  results.url2.LCP = data2["largest-contentful-paint"].numericValue;
  results.url2.TTI = data2["interactive"].numericValue;
  results.url2.TBT = data2["total-blocking-time"].numericValue;
  results.url2.CLS = data2["cumulative-layout-shift"].numericValue;

  return results;
};

// Run the comparison
const runCompare = async (times) => {
  const accumulatedResults = [];

  for (let i = 0; i < times; i++) {
    let results = await compareReports("https://www.iciciprulife.com/testing/child-insurance/smart-kid-child-savings-plan-calculator.html", "https://www.iciciprulife.com/testing/child-insurance/smart-kid-child-savings-plan-calculator-revamp.html");

    accumulatedResults.push({
      FCP1: results.url1.FCP,
      SI1: results.url1.SI,
      LCP1: results.url1.LCP,
      TTI1: results.url1.TTI,
      TBT1: results.url1.TBT,
      CLS1: results.url1.CLS,

      FCP2: results.url2.FCP,
      SI2: results.url2.SI,
      LCP2: results.url2.LCP,
      TTI2: results.url2.TTI,
      TBT2: results.url2.TBT,
      CLS2: results.url2.CLS,
    });

    // Output comparison results
    const data = [
      ["Type", "Old", "Revamp"],
      ["First Contentful Paint", JSON.stringify(results.url1.FCP), JSON.stringify(results.url2.FCP)],
      ["Speed Index", JSON.stringify(results.url1.SI), JSON.stringify(results.url2.SI)],
      ["Largest Contentful Paint", JSON.stringify(results.url1.LCP), JSON.stringify(results.url2.LCP)],
      ["Time to Interactive", JSON.stringify(results.url1.TTI), JSON.stringify(results.url2.TTI)],
      ["Total Blocking Time", JSON.stringify(results.url1.TBT), JSON.stringify(results.url2.TBT)],
      ["Cumulative Layout Shift", JSON.stringify(results.url1.CLS), JSON.stringify(results.url2.CLS)],
    ];

    const formattedRows = data.map((row) => `${row[0].toString().padEnd(30)} ${row[1].toString().padEnd(20)} ${row[2].padEnd(15)}`);

    console.log(formattedRows.join("\n"));
    console.log("\n");
  }
  // console.log("total", accumulatedResults);
  const totals = accumulatedResults.reduce((acc, curr) => {
    for (const [key, value] of Object.entries(curr)) {
      acc[key] = (acc[key] || 0) + value;
    }
    return acc;
  }, {});

  console.log(totals);
  console.log("First Contentful Paint", totals.FCP1 / times - totals.FCP2 / times);
  console.log("Speed Index", totals.SI1 / times - totals.SI2 / times);
  console.log("Largest Contentful Paint", totals.LCP1 / times - totals.LCP2 / times);
  console.log("Time to Interactive", totals.TTI1 / times - totals.TTI2 / times);
  console.log("Total Blocking Time", totals.TBT1 / times - totals.TBT2 / times);
  console.log("Cumulative Layout Shift", totals.CLS1 / times - totals.CLS2 / times);
};

runCompare(5);