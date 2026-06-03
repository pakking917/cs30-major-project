// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let data;
let tickerLibrary;
let stockPrices = [];
let currentPrice = 0;

let cash = 10000;

let stock = "MCD";
let stockData;
let shares = 0;
let portfolioValue = 0;

let simulationPrices = [];

function preload() {
  tickerLibrary = loadJSON('nasdaq_tickers.json');
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeSystem();
  stockData = await grabPriceHistory(stock);
  
  console.log(stockData, 'stockData');

  stockPrices = parseHistoricalData(stockData);

  console.log(stockPrices, 'stockPrices');

  currentPriceData = await grabCurrentPrice(stock);
  currentPrice = currentPriceData.close;
  console.log(currentPrice, 'currentPrice');
  stockPrices.push(currentPrice);
  console.log(stockPrices);


  drawGraph(stockPrices);
  endData = applyStrategy(stockPrices, 14, 14);
  let endBalance = endData.finalCash;
  let shares = endData.finalShares;
  let endPrice = endData.finalPrice;
  let portValue = endData.endingValue;
  
  console.log(`Ending Balance: $${endBalance.toFixed(2)}, Ending Price: $${endPrice.toFixed(2)}, Shares: ${shares.toFixed(2)}`);
  console.log(`Portfolio value: $${portValue.toFixed(2)}`);
  
  console.log(calculateRSIArray(stockPrices, 14)[stockPrices.length - 1], stockPrices[stockPrices.length - 1]);
  console.log(portValue, stockPrices[stockPrices.length - 1] / stockPrices[0] * 1000);

}

function draw() {
}

function initializeSystem()  {
  buyButton = createButton("Buy 1 Share");
  buyButton.position(20, 20);
  buyButton.mousePressed(buyShare);

  sellButton = createButton("Sell 1 Share");
  sellButton.position(120, 20);
  sellButton.mousePressed(sellShare);

  simulateButton = createButton("Run Simulation");
  simulateButton.position(220, 20);
  simulateButton.mousePressed(runMonteCarlo);

}

function updateSystem() {

}

function runMonteCarlo() {
  simulationPrices = generatePrice(stockPrices);
  background(255);
  drawGraph(stockPrices);
  drawGraph(simulationPrices, [255, 0, 0]);
}

function parseHistoricalData(data, length = 1000) {
  someData = [];
  for (let i = data.length - length; i < data.length; i++) {
    someData.push(data[i].close);
  }
  return someData;
}


function buyShare() {
  if (cash >= currentPrice) {
    shares++;
    cash -= currentPrice;
  }
  console.log(shares, cash);
}

function sellShare() {
  if (shares >= 1) {
    shares--;
    cash += currentPrice;
  }
  console.log(shares, cash);

}

function drawGraph(priceArray, color = [0, 255, 0]) {
  let graphX = 50;
  let graphY = 50;
  
  let graphW = width - graphX * 2;
  let graphH = height - graphY * 2;
  
  // Border
  stroke(255);
  noFill();
  
  rect(graphX, graphY, graphW, graphH);
  
  // Draw current price line
  stroke(color);
  strokeWeight(2);
  
  beginShape();
  
  for (let i = 0; i < priceArray.length; i++) {
    
    let x = map(i, 0, priceArray.length - 1, graphX, graphX + graphW);
    
    let y = map(priceArray[i], min(priceArray), max(priceArray), graphY + graphH, graphY);
    
    vertex(x, y);
  }
  
  endShape();
}


async function grabCurrentPrice(ticker) {
  let link = `https://stock-proxy-umber.vercel.app/api/stock?ticker=${ticker}&target=current`;
  const data = await getData(link);
  return data;
}

async function grabPriceHistory(ticker) {
  let link = `https://stock-proxy-umber.vercel.app/api/stock?ticker=${ticker}&target=history`;
  const data = await getData(link);
  return data;
}

async function getData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data;
  } 
  catch (error) {
    console.error("Error fetching data:", error);
  }
}

function generatePrice(priceHistory, averageReturn = 0.0003, volatility = 0.02, totalTime = 100, steps = 600) {
  let prices = structuredClone(priceHistory);
  let currentPrice = priceHistory[priceHistory.length - 1];

  let dStep = totalTime / steps; 


  for (let i = 0; i < steps; i += dStep) {

    let u1 = random();
    let u2 = random();
    let z0 = Math.sqrt(-2 * Math.log(u1)) *  Math.cos(TAU * u2);

    let drift = (averageReturn - 0.5 * Math.pow(volatility, 2)) * dStep;
    let diffusion = volatility * Math.sqrt(dStep) * z0;
    
    currentPrice *= Math.exp(drift + diffusion);
    prices.push(currentPrice);

  }

  return prices;
}

function comparePrice(priceArray) {
  return priceArray[priceArray.length - 1] > priceArray[0];
}

function calculateRSIArray(priceArray, periods) {
  if (!priceArray || priceArray.length <= periods) {
    return [];
  }

  let rsiArray = new Array(priceArray.length).fill(null);
  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 1; i <= periods; i++) {
    const difference = priceArray[i] - priceArray[i-1];
    if (difference > 0) {
      totalGain += difference;
    }
    else {
      totalLoss -= difference;
    }
  }

  let avgGain = totalGain / periods;
  let avgLoss = totalLoss / periods;

  if (avgLoss === 0) {
    rsiArray[periods] = 100;
  }
  else {
    rsiArray[periods] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  // Wilder's Smoothing
  for (let i = periods + 1; i < priceArray.length; i++) {
    const difference = priceArray[i] - priceArray[i-1];
    let currentLoss = 0;
    let currentGain = 0;

    if (difference > 0) {
      currentGain = difference;
    }
    else {
      currentLoss = -difference;
    }

    avgGain = (avgGain * (periods - 1) + currentGain) / periods;
    avgLoss = (avgLoss * (periods - 1) + currentLoss) / periods;

    if (avgLoss === 0) {
      rsiArray[i] = 100;
    } 
    else {
      const rs = avgGain / avgLoss;
      rsiArray[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsiArray;
}

function applyStrategy(priceArray, periods, startPeriods) {
  let shares = 0;
  let cash = 1000;

  const rsiArray = calculateRSIArray(priceArray, periods);
  

  for (let i = startPeriods; i < priceArray.length; i++) {
    const currentRSI = rsiArray[i];
    const currentPrice = priceArray[i];

    if (currentRSI < 20 && cash > 0) {
      // Goes "all in" with whatever cash is available
      const sharesToBuy = cash / currentPrice; 
      shares += sharesToBuy;
      // console.log(`Buy at: $${currentPrice.toFixed(2)} | Invested: $${cash.toFixed(2)}`);
      cash = 0; 
    } 
    else if (currentRSI > 80 && shares > 0) { 
      cash += shares * currentPrice;
      // console.log(`Sell at: $${currentPrice.toFixed(2)} | Liquidated: ${shares.toFixed(2)} shares`);
      shares = 0;
    }
  }

  const finalPrice = priceArray[priceArray.length - 1];

  return {
    finalCash: cash,
    finalPrice: finalPrice,
    finalShares: shares,
    endingValue: cash + shares * finalPrice
  };
}

function checkTicker(ticker) {
  return tickerLibrary.include(ticker); 
}