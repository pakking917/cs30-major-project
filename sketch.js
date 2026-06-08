// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let tickerLibrary;
let tickerArray;

let ohlcData = [];
let closePrices = [];
let dateLabels = [];

let currentPrice = 0;
let stock = "MCD";
let isLoading = false;

let cash = 10000;
let shares = 0;
let portfolioValue = 0;

let holdings = new Map();
let chartMode = "line";

let simPaths = [];
let simMode = false;
let simFrame = 0;
let simTotalFrames = 0;
let simPlaying = false;
let simSpeed = 1;
let simStepsPerPath = 120;

const PAD        = 60;
const HUD_W      = 220;
const RSI_H      = 120;
const RSI_GAP    = 10;
const TOP_BAR    = 55;


const COL_BG       = [15,  17,  26];
const COL_PANEL    = [22,  25,  38];
const COL_BORDER   = [50,  55,  80];
const COL_GREEN    = [0,   220, 130];
const COL_RED      = [255, 80,  80];
const COL_BLUE     = [80,  160, 255];
const COL_SIM      = [255, 160, 40];
const COL_TEXT     = [200, 210, 230];
const COL_MUTED    = [100, 110, 140];
const COL_RSI_LINE = [180, 120, 255];

let buyButton, sellButton, resetButton;
let chartToggleButton;
let tickerInput, loadButton;
let simAddButton, simPlayButton, simPauseButton, simFwdButton, simClearButton;


function preload() {
  tickerLibrary = loadJSON('company_tickers.json');
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeSystem();
  stockData = await grabPriceHistory(stock);
  

  stockPrices = parseHistoricalData(stockData);


  currentPriceData = await grabCurrentPrice(stock);
  currentPrice = currentPriceData.close;
  console.log(currentPrice, 'currentPrice');
  stockPrices.push(currentPrice);


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

// --- Local Storage --------------------------------

// Save the last-viewed ticker 
function saveLastTicker(ticker) {
  localStorage.setItem('stock_sim_last_ticker', ticker);
}

// Returns the saved ticker, or null if none exists
function loadLastTicker() {
  return localStorage.getItem('stock_sim_last_ticker');
}

// Serialize portfolio to localStorage with JSON.stringify
function savePortfolio() {
  let data = {
    cash: cash,
    holdings: Array.from(holdings.entries())
  };
  localStorage.setItem('stock_sim_portfolio', JSON.stringify(data));
}

// Read portfolio from localStorage and restore cash + holdings Map.
function loadPortfolio() {
  let raw = localStorage.getItem('stock_sim_portfolio');
  if (!raw) {
    return;
  }
  try {
    let data = JSON.parse(raw);
    cash = (typeof data.cash === 'number') ? data.cash : startingCash;
    holdings = new Map(data.holdings || []);
  } 
  catch (e) {
    console.warn("Could not parse saved portfolio:", e);
  }
}

// Snapshot the current stock's share count into the holdings map,
function flushCurrentStockToHoldings() {
  if (shares > 0) {
    holdings.set(stock, shares);
  } 
  else {
    holdings.delete(stock); // remove zero-share entries
  }
  savePortfolio();
}

// --- Coordinate calculators --------------------------------

function graphBounds() {
  return {
    x: PAD,
    y: TOP_BAR + PAD * 0.6,
    w: width - PAD - HUD_W - 12,
    h: height - (TOP_BAR + PAD * 0.6) - RSI_H - RSI_GAP - PAD
  };
}

function visibleCloses() { // returns the union of real bars plus the currently-revealed portion
  if (!simMode || simPaths.length === 0) {
    return closePrices;
  }
  let combined = [...closePrices];
  for (let p of simPaths) {
    let slice = p.closes.slice(closePrices.length, closePrices.length + simFrame);
    combined = combined.concat(slice);
  }
  return combined;
}

function visibleDates() {
  if (!simMode || simPaths.length === 0) {
    return dateLabels;
  }
  let future = simPaths[0].dates.slice(closePrices.length, closePrices.length + simFrame);
  return [...dateLabels, ...future];
}

function visibleLength() { // Total number of points currently shown on the time axis
  if (!simMode || simPaths.length === 0) {
    return closePrices.length;
  }
  return closePrices.length + simFrame;
}

function dataX(i, totalLen, graphx, graphw) {
  return map(i, 0, totalLen - 1, graphx, graphx + graphw);
}

function priceY(p, low, high, graphy, graphh) {
  return map(p, low, high, graphy + graphh, graphy);
}

// --- Graphics --------------------------------


function drawHUD() {
  let hx = width - HUD_W + 5;
  let hy = TOP_BAR + PAD;
  let hw = HUD_W - 15;
  let hh = height - hy - PAD * 0.5;

  fill(...COL_PANEL);
  stroke(...COL_BORDER);
  strokeWeight(1);
  rect(hx, hy, hw, hh, 6);

  noStroke();
  let lineH = 28;
  let curY  = hy + 16;
}

function drawTickerLabel() {
  let { x, y } = graphBounds();
  fill(...COL_TEXT);
  noStroke();
  textFont('Google Sans');
  textSize(18);
  textAlign(LEFT, BOTTOM);
  text(stock, x + 8, y - 4);

  // Price change
  if (stockPrices.length > 1) {
    let change    = stockPrices[stockPrices.length - 1] - stockPrices[0];
    let changePct = change / stockPrices[0] * 100;
    let col       = change >= 0 ? COL_GREEN : COL_RED;
    fill(...col);
    textSize(13);
    let sign = change >= 0 ? "+" : "";
    text(sign + "$" + change.toFixed(2) + " (" + sign + changePct.toFixed(2) + "%)", x + 70, y - 6);
  }
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

  tickerArray = extractValues(tickerLibrary);
  console.log(tickerArray);
}

function updateSystem() {

}

function runMonteCarlo() {
  simulationPrices = generatePrice(stockPrices);
  background(255);
  drawGraph(stockPrices);
  drawGraph(simulationPrices, [255, 0, 0]);
}

function parseHistoricalData(data, length = 600) {
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

// --- API --------------------------------

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

// --- Price Simulation --------------------------------

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

// --- RSI --------------------------------

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

    if (currentRSI < 30 && cash > 0) {
      const sharesToBuy = cash / currentPrice; 
      shares += sharesToBuy;
      cash = 0; 
    } 
    else if (currentRSI > 70 && shares > 0) { 
      cash += shares * currentPrice;
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

// --- Ticker Validation --------------------------------

function checkTicker(ticker) {
  return tickerArray.includes(ticker); 
}

function extractValues(obj) {
  const values = Object.values(obj);
  return values.map(function(item) {
    return item.ticker;
  });
}

function comparePrice(priceArray) {
  return priceArray[priceArray.length - 1] > priceArray[0];
}


// --- Resizing --------------------------------

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Reposition the ticker input/button on resize
  tickerInput.position(width - HUD_W - 160, 12);
  loadButton.position(width - HUD_W - 70, 12);
  redrawAll();
}