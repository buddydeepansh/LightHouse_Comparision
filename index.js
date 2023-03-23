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
  // try {
  //   fs.writeFileSync(filename1, JSON.stringify(data1), (err) => {
  //     if (err) throw err;
  //     console.log(`Audits data written to ${filename1}`);
  //   });
  //   fs.writeFileSync(filename2, JSON.stringify(data2), (err) => {
  //     if (err) throw err;
  //     console.log(`Audits data written to ${filename1}`);
  //   });
  // } catch (err) {
  //   console.log("error on fs statement", err);
  // }

  results.url1.FCP = data1["first-contentful-paint"].numericValue === undefined ? "0" : JSON.stringify(data1["first-contentful-paint"].numericValue);
  results.url1.SI = data1["speed-index"].numericValue === undefined ? "0" : JSON.stringify(data1["speed-index"].numericValue);
  results.url1.LCP = data1["largest-contentful-paint"].numericValue === undefined ? "0" : JSON.stringify(data1["largest-contentful-paint"].numericValue);
  results.url1.TTI = data1["interactive"].numericValue === undefined ? "0" : JSON.stringify(data1["interactive"].numericValue);
  results.url1.TBT = data1["total-blocking-time"].numericValue === undefined ? "0" : JSON.stringify(data1["total-blocking-time"].numericValue);
  results.url1.CLS = data1["cumulative-layout-shift"].numericValue === undefined ? "0" : JSON.stringify(data1["cumulative-layout-shift"].numericValue);

  // Get CLS, SI, and LCP for URL2
  results.url2.FCP = data2["first-contentful-paint"].numericValue === undefined ? "0" : JSON.stringify(data2["first-contentful-paint"].numericValue);
  results.url2.SI = data2["speed-index"].numericValue === undefined ? "0" : JSON.stringify(data2["speed-index"].numericValue);
  results.url2.LCP = data2["largest-contentful-paint"].numericValue === undefined ? "0" : JSON.stringify(data2["largest-contentful-paint"].numericValue);
  results.url2.TTI = data2["interactive"].numericValue === undefined ? "0" : JSON.stringify(data2["interactive"].numericValue);
  results.url2.TBT = data2["total-blocking-time"].numericValue === undefined ? "0" : JSON.stringify(data2["total-blocking-time"].numericValue);
  results.url2.CLS = data2["cumulative-layout-shift"].numericValue === undefined ? "0" : JSON.stringify(data2["cumulative-layout-shift"].numericValue);

  return results;
};

// Run the comparison
const runCompare = async (times) => {
  const accumulatedResults = [];
  let sucessArray = [];
  let readData = fs.readFileSync("success.json", { encoding: "utf8", flag: "r" });
  readData = JSON.parse(readData);

  if (readData.length > 0) {
    readData[0].map((item) => {
      sucessArray.push(item);
    });
    times = sucessArray.length >= times ? 0 : times - sucessArray.length;
  }
  for (let i = 0; i < times; i++) {
    let results = await compareReports("https://www.iciciprulife.com/testing/child-insurance/smart-kid-child-savings-plan-calculator.html", "https://www.iciciprulife.com/testing/child-insurance/smart-kid-child-savings-plan-calculator-revamp.html");
    await sucessArray.push(results);
    try {
      fs.writeFileSync("success.json", JSON.stringify(sucessArray), (err) => {
        if (err) throw err;
        console.log(`Sucess data error to sucess.json`);
      });
    } catch (err) {
      console.log("error on fs statement sucess array write file", err);
    }

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
      ["First Contentful Paint", results.url1.FCP, results.url2.FCP],
      ["Speed Index", results.url1.SI, results.url2.SI],
      ["Largest Contentful Paint", results.url1.LCP, results.url2.LCP],
      ["Time to Interactive", results.url1.TTI, results.url2.TTI],
      ["Total Blocking Time", results.url1.TBT, results.url2.TBT],
      ["Cumulative Layout Shift", results.url1.CLS, results.url2.CLS],
    ];

    const formattedRows = data.map((row) => `${row[0].toString().padEnd(30)} ${row[1].toString().padEnd(20)} ${row[2].padEnd(15)}`);

    console.log(formattedRows.join("\n"));
    console.log("\n");
  }
  // console.log("total", accumulatedResults);
  const totals = accumulatedResults.reduce((acc, curr) => {
    for (const [key, value] of Object.entries(curr)) {
      acc[key] = parseFloat(acc[key] || 0) + parseFloat(value);
    }
    return acc;
  }, {});

  console.log(totals);
  for (let key in totals) {
    totals[key] = totals[key] / times;
  }
  totals["FCPStatus"] = totals.FCP1 > totals.FCP2 ? `Good ${100 - (totals.FCP2 / totals.FCP1) * 100}` : `BAD ${100 - (totals.FCP1 / totals.FCP2) * 100}`;
  totals["SIStatus"] = totals.SI1 > totals.SI2 ? `Good ${100 - (totals.SI2 / totals.SI1) * 100}` : `BAD ${(totals.SI1 / totals.SI2) * 100}`;
  totals["LCPStatus"] = totals.LCP1 > totals.LCP2 ? `Good ${100 - (totals.LCP2 / totals.LCP1) * 100}` : `BAD ${100 - (totals.LCP1 / totals.LCP2) * 100}`;
  totals["TTIStatus"] = totals.TTI1 > totals.TTI2 ? `Good ${100 - (totals.TTI2 / totals.TTI1) * 100}` : `BAD ${100 - (totals.TTI1 / totals.TTI2) * 100}`;
  totals["TBTStatus"] = totals.TBT1 > totals.TBT2 ? `Good ${100 - (totals.TBT2 / totals.TBT1) * 100}` : `BAD ${100 - (totals.TBT1 / totals.TBT2) * 100}`;
  totals["CLSStatus"] = totals.CLS1 > totals.CLS2 ? `Good ${1 - totals.CLS2 / totals.CLS1}` : `BAD ${1 - (totals.CLS1 / totals.CLS2) * 1}`;
  console.log("First Contentful Paint", totals.FCP1, totals.FCP2, totals.FCP1 - totals.FCP2, totals.FCPStatus);
  console.log("Speed Index", totals.SI1, totals.SI2, totals.SI1 - totals.SI2, totals.SIStatus);
  console.log("Largest Contentful Paint", totals.LCP1, totals.LCP2, totals.LCP1 - totals.LCP2, totals.LCPStatus);
  console.log("Time to Interactive", totals.TTI1, totals.TTI2, totals.TTI1 - totals.TTI2, totals.TTIStatus);
  console.log("Total Blocking Time", totals.TBT1, totals.TBT2, totals.TBT1 - totals.TBT2, totals.TBTStatus);
  console.log("Cumulative Layout Shift", totals.CLS1, totals.CLS2, totals.CLS1 - totals.CLS2, totals.CLSStatus);
};

runCompare(5);
