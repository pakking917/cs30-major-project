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
let startingCash = 10000;
let shares = 0;
let quantityInput;

let holdings = new Map();
let lastPrices = new Map();
let chartMode = "line";

let simPaths = [];
let simMode = false;
let simFrame = 0;
let simTotalFrames = 0;
let simPlaying = false;
let simSpeed = 1;
let simStepsPerPath = 1000;

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
const COL_RSI      = [180, 120, 255];
const COL_CROSS    = [180, 180, 180];


let buyButton, sellButton, resetButton;
let chartToggleButton;
let tickerInput, loadButton;
let simAddButton, simPlayButton, simPauseButton, simFwdButton, simClearButton;

let showInfo = false;
let infoButton;


function preload() {
  tickerLibrary = loadJSON('company_tickers.json');
}

async function setup() {
  createCanvas(max(800, windowWidth), max(450, windowHeight));
  background(...COL_BG);
  textFont('Google Sans');
  initializeSystem();

  loadPortfolio();

  let saved = loadLastTicker();
  if (saved) {
    stock = saved;
  }

  showLoading("Loading " + stock + "...");
  await loadStock(stock);
}

function draw() {
  if (isLoading) {
    return;
  }
  if (simMode && simPlaying && simPaths.length > 0) {
    simFrame = min(simFrame + simSpeed, simTotalFrames);
    if (simFrame >= simTotalFrames) {
      simPlaying = false;
    }
  }
  redrawAll();
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
    holdings: Array.from(holdings.entries()),
    lastPrices: Array.from(lastPrices.entries())
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
    lastPrices = new Map(data.lastPrices || []);
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

// --- Graphics: HUD --------------------------------
function drawHUD() {
  let hx = width - HUD_W + 5;
  let hy = TOP_BAR;
  let hw = HUD_W - 15;
  let hh = height - hy - PAD * 0.5;

  fill(...COL_PANEL);
  stroke(...COL_BORDER);
  strokeWeight(1);
  rect(hx, hy, hw, hh, 6);

  noStroke();
  let lineH = 28;
  let curY  = hy + 16;

  function row(label, value, valCol) {
    fill(...COL_MUTED);
    textSize(10);
    textAlign(LEFT, TOP);
    text(label, hx + 10, curY);
    fill(...(valCol || COL_TEXT));
    textSize(12);
    textAlign(RIGHT, TOP);
    text(value, hx + hw - 8, curY);
    textAlign(LEFT, TOP);
    curY += lineH;
  }

  function divider() {
    stroke(...COL_BORDER);
    strokeWeight(1);
    line(hx + 6, curY - 4, hx + hw - 6, curY - 4);
    noStroke();
    curY += 4;
  }

  fill(...COL_TEXT);
  textSize(13);
  text("PORTFOLIO", hx + 45, curY);
  curY += lineH * 0.9;
  divider();

  row("CASH",   "$" + cash.toFixed(2));
  row("SHARES", shares.toFixed(4) + " " + stock);
  row("PRICE",  "$" + currentPrice.toFixed(2), COL_BLUE);

  divider();

  let totalHoldingsValue = 0;
  for (let [t, sCount] of holdings.entries()) {
    let p = lastPrices.get(t) || 0;
    if (t === stock) p = currentPrice; // Prioritize real-time price updates
    totalHoldingsValue += sCount * p;
  }
  let portVal = cash + totalHoldingsValue;
  let pnl     = portVal - startingCash;
  let pnlPct  = (pnl / startingCash) * 100;
  let pSign   = pnl >= 0 ? "+" : "";
  row("TOTAL", "$" + portVal.toFixed(2));
  row("P&L",   pSign + "$" + pnl.toFixed(2) + " (" + pSign + pnlPct.toFixed(1) + "%)", pnl >= 0 ? COL_GREEN : COL_RED);

  divider();

  let rsiArray = calculateRSIArray(closePrices, 14);
  let lastRSI  = null;
  for (let i = rsiArray.length - 1; i >= 0; i--) {
    if (rsiArray[i] !== null) {
      lastRSI = rsiArray[i]; 
      break; 
    }
  }
  if (lastRSI !== null) {
    let sig    = lastRSI > 70 ? "OVERBOUGHT" : lastRSI < 30 ? "OVERSOLD" : "NEUTRAL";
    let sigCol = lastRSI > 70 ? COL_RED : lastRSI < 30 ? COL_GREEN : COL_MUTED;
    row("RSI", lastRSI.toFixed(1) + "  " + sig, sigCol);
  }

  divider();

  row("HIGH", "$" + max(closePrices).toFixed(2), COL_GREEN);
  row("LOW",  "$" + min(closePrices).toFixed(2), COL_RED);
}

// --- Graphics: Ticker --------------------------------

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

function drawTickerHeader(x, y) {
  noStroke();
  fill(...COL_TEXT);
  textFont('Google Sans');
  textSize(16);
  textAlign(LEFT, BOTTOM);
  text(stock, x, y - 6);

  if (closePrices.length > 1) {
    let chg    = closePrices[closePrices.length - 1] - closePrices[0];
    let chgPct = chg / closePrices[0] * 100;
    fill(chg >= 0 ? COL_GREEN : COL_RED);
    textSize(12);
    let s = chg >= 0 ? "+" : "";
    text(s + "$" + chg.toFixed(2) + "  " + s + chgPct.toFixed(2) + "%", x + 55, y - 6);
  }

  fill(...COL_MUTED);
  textSize(11);
  textAlign(RIGHT, BOTTOM);
  text(chartMode === "candle" ? "CANDLESTICK" : "LINE", x + (width - PAD - HUD_W - 12) - 4, y - 6);
}

// --- Graphics: Grid --------------------------------

function drawGridAndAxes(x, y, w, h, lo, hi, totalLen) {
  let vDates = visibleDates();
  textFont('Google Sans');

  // Y-axis: 5 evenly-spaced price gridlines with labels
  const Y_TICKS = 5;
  for (let i = 0; i <= Y_TICKS; i++) {
    let val = map(i, 0, Y_TICKS, lo, hi);
    let ty  = priceY(val, lo, hi, y, h);
    stroke(...COL_BORDER);
    strokeWeight(0.5);
    line(x, ty, x + w, ty);
    noStroke();
    fill(...COL_MUTED);
    textSize(10);
    textAlign(RIGHT, CENTER);
    text("$" + val.toFixed(2), x - 5, ty);
  }

  // X-axis: ~7 evenly-spaced date labels
  const X_TICKS = min(7, totalLen - 1);
  for (let i = 0; i <= X_TICKS; i++) {
    let idx = floor(map(i, 0, X_TICKS, 0, totalLen - 1));
    let tx  = dataX(idx, totalLen, x, w);
    stroke(...COL_BORDER);
    strokeWeight(0.5);
    line(tx, y, tx, y + h);
    noStroke();
    fill(...COL_MUTED);
    textSize(10);
    textAlign(CENTER, TOP);
    text(formatDate(vDates[idx] || ""), tx, y + h + 4);
  }

  stroke(...COL_BORDER);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h);
}

function formatDate(d) {

  let parts = d.split("-");
  if (parts.length < 3) {
    return d;
  }
  let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[parseInt(parts[1]) - 1] + " " + parseInt(parts[2]);
}

// --- Graphics: Loading Screen --------------------------------

function showLoading(msg) {
  background(...COL_BG);
  fill(...COL_TEXT);
  noStroke();
  textFont('Google Sans');
  textSize(15);
  textAlign(CENTER, CENTER);
  text(msg, width / 2, height / 2);
}

// --- Graphics: Charts --------------------------------

function drawMainChart(x, y, w, h, lo, hi, totalLen) {
  if (chartMode === "line") {
    drawLineChart(closePrices, x, y, w, h, lo, hi, totalLen, COL_GREEN);
  }
  else {
    drawCandleChart(x, y, w, h, lo, hi, totalLen);
  }
}

function drawLineChart(prices, x, y, w, h, lo, hi, totalLen, col) {
  stroke(...col);
  strokeWeight(1.5);
  noFill();
  beginShape();
  for (let i = 0; i < prices.length; i++) {
    vertex(dataX(i, totalLen, x, w), priceY(prices[i], lo, hi, y, h));
  }
  endShape();
}

function drawCandleChart(x, y, w, h, lo, hi, totalLen) {
  let slotW   = w / totalLen;
  let candleW = max(1, slotW * 0.7);
  for (let i = 0; i < ohlcData.length; i++) {
    let d      = ohlcData[i];
    let cx     = dataX(i, totalLen, x, w);
    let openY  = priceY(d.open,  lo, hi, y, h);
    let closeY = priceY(d.close, lo, hi, y, h);
    let highY  = priceY(d.high,  lo, hi, y, h);
    let lowY   = priceY(d.low,   lo, hi, y, h);
    let col    = (d.close >= d.open) ? COL_GREEN : COL_RED;
    stroke(...col);
    strokeWeight(1);
    line(cx, highY, cx, lowY);
    fill(...col);
    noStroke();
    rect(cx - candleW / 2, min(openY, closeY), candleW, max(1, abs(openY - closeY)));
  }
}

// --- Graphics: RSI Chart --------------------------------
function drawRSI(x, y, w, h, totalLen) {
  let rsiY     = y + h + RSI_GAP + 18;
  let rsiH     = RSI_H;
  let rsiArray = calculateRSIArray(closePrices, 14);

  fill(...COL_PANEL);
  stroke(...COL_BORDER);
  strokeWeight(1);
  rect(x, rsiY, w, rsiH);

  let y70 = map(70, 0, 100, rsiY + rsiH, rsiY);
  let y30 = map(30, 0, 100, rsiY + rsiH, rsiY);
  stroke(...COL_RED);   strokeWeight(0.6); line(x, y70, x + w, y70);
  stroke(...COL_GREEN); strokeWeight(0.6); line(x, y30, x + w, y30);

  stroke(...COL_RSI);
  strokeWeight(1.4);
  noFill();
  beginShape();
  for (let i = 0; i < rsiArray.length; i++) {
    if (rsiArray[i] === null) {
      continue;
    }
    vertex(dataX(i, totalLen, x, w), map(rsiArray[i], 0, 100, rsiY + rsiH, rsiY));
  }
  endShape();

  noStroke();
  fill(...COL_MUTED);
  textSize(10);
  textAlign(RIGHT, CENTER);
  text("70", x - 4, y70);
  text("30", x - 4, y30);
  textAlign(LEFT, TOP);
  fill(...COL_RSI);
  text("RSI(14)", x + 4, rsiY + 3);

  let lastRSI = null;
  for (let i = rsiArray.length - 1; i >= 0; i--) {
    if (rsiArray[i] !== null) {
      lastRSI = rsiArray[i]; break; 
    }
  }
  if (lastRSI !== null) {
    fill(lastRSI > 70 ? COL_RED : lastRSI < 30 ? COL_GREEN : COL_TEXT);
    textAlign(RIGHT, TOP);
    text(lastRSI.toFixed(1), x + w - 4, rsiY + 3);
  }
}

function drawSeparator(x, y, w, h) {
  stroke(...COL_BORDER);
  strokeWeight(1);
  line(x, y + h + 1, x + w, y + h + 1);
}


// --- Graphics: Simulation Paths --------------------------------

function drawSimPaths(x, y, w, h, lo, hi, totalLen) {
  let realLen = closePrices.length;

  for (let p of simPaths) {
    let futureEnd = min(realLen + simFrame, p.closes.length);
    stroke(...p.col);
    strokeWeight(1.5);
    noFill();
    beginShape();
    for (let i = realLen - 1; i < futureEnd; i++) {
      vertex(dataX(i, totalLen, x, w), priceY(p.closes[i], lo, hi, y, h));
    }
    endShape();
  }

  // Dashed divider between real data and simulated region
  let divX = dataX(realLen - 1, totalLen, x, w);
  stroke(...COL_BORDER);
  strokeWeight(1);
  setLineDash([4, 4]);
  line(divX, y, divX, y + h);
  setLineDash([]);
  noStroke();
  fill(...COL_MUTED);
  textSize(10);
  textAlign(LEFT, TOP);
  text("SIMULATED →", divX + 4, y + 4);
}

function setLineDash(pattern) {
  drawingContext.setLineDash(pattern);
}

// --- Graphics: Crosshair --------------------------------
function drawCrosshair(x, y, w, h, lo, hi, totalLen) {
  if (mouseX < x || mouseX > x + w || mouseY < y || mouseY > y + h) {
    return;
  }

  let vDates  = visibleDates();
  let vCloses = visibleCloses();

  // Map mouseX to nearest data index across the full visible range
  let idx = constrain(round(map(mouseX, x, x + w, 0, totalLen - 1)), 0, totalLen - 1);

  // For indices beyond real data, pick the first sim path for the price value.
  let price;
  if (idx < closePrices.length) {
    price = closePrices[idx];
  }
  else if (simPaths.length > 0) {
    price = simPaths[0].closes[idx] || closePrices[closePrices.length - 1];
  }
  else {
    return;
  }

  let cx = dataX(idx, totalLen, x, w);
  let cy = priceY(price, lo, hi, y, h);

  stroke(...COL_CROSS);
  strokeWeight(0.7);
  setLineDash([3, 3]);
  line(cx, y, cx, y + h);
  line(x, cy, x + w, cy);
  setLineDash([]);

  fill(...COL_BG);
  noStroke();
  rect(0, cy - 9, x - 1, 18);
  fill(...COL_TEXT);
  textAlign(RIGHT, CENTER);
  textSize(10);
  text("$" + price.toFixed(2), x - 3, cy);

  let rsiArray = calculateRSIArray (closePrices, 14);
  let rsiVal   = (idx < rsiArray.length) ? rsiArray[idx] : null;
  let tipLines = [vDates[idx] || ("Day " + idx), "$" + price.toFixed(2)];
  if (rsiVal !== null) {
    tipLines.push("RSI: " + rsiVal.toFixed(1));
  }

  let tipW = 105, tipH = tipLines.length * 16 + 10;
  let tipX = cx + 8, tipY = constrain(cy - tipH / 2, y, y + h - tipH);
  if (tipX + tipW > x + w) {
    tipX = cx - tipW - 8;
  }

  fill(...COL_PANEL);
  stroke(...COL_BORDER);
  strokeWeight(1);
  rect(tipX, tipY, tipW, tipH);
  noStroke();
  fill(...COL_TEXT);
  textAlign(LEFT, TOP);
  textSize(10);
  for (let i = 0; i < tipLines.length; i++) {
    text(tipLines[i], tipX + 6, tipY + 5 + i * 16);
  }
}

// --- Graphics: Crosshair --------------------------------

function drawInfoPanel() {
  let { x, y, w, h } = graphBounds();
  fill(22, 25, 38, 245);
  stroke(...COL_BORDER);
  strokeWeight(1);
  rect(x + 30, y + 20, w - 60, h + RSI_H, 6);
  
  noStroke();
  fill(...COL_TEXT);
  textFont('Google Sans');
  textSize(14);
  textAlign(LEFT, TOP);
  text("SYSTEM DOCUMENTATION & GUIDE", x + 50, y + 40);
  
  textSize(width / 50);
  let panelText = 
    "• RSI (Relative Strength Index):\n" +
    "  A momentum oscillator tracking structural asset velocity between 0 and 100.\n" +
    "  - Readings > 70 suggest an OVERBOUGHT condition (potential drop execution).\n" +
    "  - Readings < 30 suggest an OVERSOLD condition (potential rally baseline).\n\n" +
    "• SIMULATION ENGINE:\n" +
    "  Generates asset path variants leveraging Geometric Brownian Motion (GBM).\n" +
    "  Models drift trends against localized standard deviations parsed from historical close data.\n\n" +
    "• TIMELINE CONTROLS:\n" +
    "  - Scroll Wheel: Dynamically scale layout width expansion / compression along X-Axis.\n" +
    "  - Mouse Drag: Shift and slide horizontally through structural dataset increments.";
  text(panelText, x + 50, y + 75, w - 100);
}

function redrawAll() {
  background(...COL_BG);
  if (closePrices.length === 0) {
    return;
  }

  // Y range: min/max across real and simulated data
  let vis   = visibleCloses();
  let lo    = min(vis);
  let hi    = max(vis);
  let range = hi - lo || 1;
  lo -= range * 0.05;
  hi += range * 0.05;

  let totalLen = visibleLength();
  let { x, y, w, h } = graphBounds();

  drawGridAndAxes(x, y, w, h, lo, hi, totalLen);
  drawMainChart(x, y, w, h, lo, hi, totalLen);
  if (simMode && simPaths.length > 0) {
    drawSimPaths(x, y, w, h, lo, hi, totalLen);
  }
  drawHUD();
  drawTickerHeader(x, y);
  drawCrosshair(x, y, w, h, lo, hi, totalLen);
  drawRSI(x, y, w, h, totalLen);
  drawSeparator(x, y, w, h);

  if (showInfo) {
    drawInfoPanel();
  }
}

// --- Data loading --------------------------------

async function loadStock(ticker) {
  // Before leaving the current stock, snapshot shares into holdings and persist.
  if (closePrices.length > 0) {
    flushCurrentStockToHoldings();
  }

  isLoading = true;
  simPaths = [];
  simMode = false;
  simPlaying = false;
  simFrame = 0;
  showLoading("Fetching " + ticker + "...");

  let rawHistory = await grabPriceHistory(ticker);
  if (!rawHistory || rawHistory.length === 0) {
    isLoading = false;
    showLoading("No data for " + ticker);
    return;
  }

  let slice = rawHistory.slice(-500);
  ohlcData    = slice.map(d => ({ date: d.date, open: d.open, high: d.high, low: d.low, close: d.close }));
  closePrices = ohlcData.map(d => d.close);
  dateLabels  = ohlcData.map(d => d.date);

  showLoading("Fetching current price...");
  let current = await grabCurrentPrice(ticker);
  currentPrice = current.close;
  lastPrices.set(ticker, currentPrice);

  // Append or update today's bar with the live price data.
  let today    = new Date();
  let todayStr = today.toISOString().slice(0, 10);
  if (dateLabels[dateLabels.length - 1] !== todayStr) {
    ohlcData.push({ date: todayStr, open: current.open, high: current.high, low: current.low, close: current.close });
    closePrices.push(current.close);
    dateLabels.push(todayStr);
  }
  else {
    ohlcData[ohlcData.length - 1] = { date: todayStr, open: current.open, high: current.high, low: current.low, close: current.close };
    closePrices[closePrices.length - 1] = current.close;
  }

  // Update this stock's stored price and portfolio value
  // (I don't update prices for stocks the user hasn't visited due to API limitations)
  stock = ticker;

  // Restore shares owned
  shares = holdings.get(stock) || 0;

  // Update the stored price in the portfolio
  savePortfolio();
  saveLastTicker(stock);

  isLoading = false;
  updateSimButtonVisibility();
  redrawAll();
}

// --- Buttons --------------------------------

function styleButton(btn, bgHex) {
  btn.style('background',   bgHex || '#141828');
  btn.style('color',        '#c3cde1');
  btn.style('border',       '1px solid #2d3248');
  btn.style('border-radius','0');
  btn.style('padding',      '5px 12px');
  btn.style('font-family',  'Google Sans');
  btn.style('font-size',    '12px');
  btn.style('cursor',       'pointer');
}

function initializeSystem()  {
  buyButton = createButton("Buy Shares");
  buyButton.mousePressed(buyShare);
  styleButton(buyButton, '#0b2016');

  sellButton = createButton("Sell Shares");
  sellButton.mousePressed(sellShare);
  styleButton(sellButton, '#201010');

  quantityInput = createInput("1");
  quantityInput.size(45, 20);
  quantityInput.style('background', '#0a0c14');
  quantityInput.style('color', '#c3cde1');
  quantityInput.style('border', '1px solid #2d3248');
  quantityInput.style('font-family', 'Google Sans');
  quantityInput.style('font-size', '12px');
  quantityInput.style('padding', '3px 6px');

  resetButton = createButton("Reset");
  resetButton.mousePressed(resetPort);
  styleButton(resetButton);

  chartToggleButton = createButton("Candlestick");
  chartToggleButton.mousePressed(toggleChartMode);
  styleButton(chartToggleButton);

  infoButton = createButton("Info");
  infoButton.mousePressed(infoTab);
  styleButton(infoButton);

  tickerInput = createInput(stock);
  tickerInput.size(70, 20);
  tickerInput.style('background',    '#0a0c14');
  tickerInput.style('color',         '#c3cde1');
  tickerInput.style('border',        '1px solid #2d3248');
  tickerInput.style('border-radius', '0');
  tickerInput.style('font-family',   'Google Sans');
  tickerInput.style('font-size',     '12px');
  tickerInput.style('padding',       '3px 6px');

  loadButton = createButton("Load");
  loadButton.mousePressed(handleLoad);
  styleButton(loadButton);

  simAddButton   = createButton("Add Path");
  simPlayButton  = createButton("Play");
  simPauseButton = createButton("Pause");
  simFwdButton   = createButton("+10");
  simClearButton = createButton("Clear Sim");

  simAddButton.mousePressed(addSim);
  simPlayButton.mousePressed(playSim);
  simPauseButton.mousePressed(pauseSim);
  simFwdButton.mousePressed(fwdSim);
  simClearButton.mousePressed(clearSim);

  let simButtons = [simAddButton, simPlayButton, simPauseButton, simFwdButton, simClearButton];
  for (let btn of simButtons) {
    styleButton(btn);
  }

  tickerArray = extractValues(tickerLibrary);
  repositionButtons();
  updateSimButtonVisibility();
}

function repositionButtons() {
  let nextX = 10, by = 12, gap = 6;
  function place(btn) {
    btn.position(nextX, by); 
    nextX += btn.elt.offsetWidth + gap; 
  }
  place(quantityInput);
  place(buyButton);
  place(sellButton);
  place(resetButton);
  nextX += 14;
  place(chartToggleButton);
  nextX += 14;
  place(infoButton);
  place(simAddButton);
  place(simPlayButton);
  place(simPauseButton);
  place(simFwdButton);
  place(simClearButton);
  tickerInput.position(width - HUD_W - 140, by);
  loadButton.position(width - HUD_W - 55, by);
}

function updateSimButtonVisibility() {
  let show = simMode && simPaths.length > 0;
  simPlayButton.elt.style.display  = show ? "inline-block" : "none";
  simPauseButton.elt.style.display = show ? "inline-block" : "none";
  simFwdButton.elt.style.display   = show ? "inline-block" : "none";
  simClearButton.elt.style.display = show ? "inline-block" : "none";
  simAddButton.elt.style.display   = (chartMode === "line") ? "inline-block" : "none";

  repositionButtons();
}

function toggleChartMode() {
  if (chartMode === "line") {
    chartMode = "candle";
    chartToggleButton.html("Line Chart");
    clearSim();
  }
  else {
    chartMode = "line";
    chartToggleButton.html("Candlestick");
  }
  updateSimButtonVisibility();
  redrawAll();
}

async function handleLoad() {
  let t = tickerInput.value().toUpperCase().trim();
  if (!t) {
    return;
  }
  if (!checkTicker(t)) {
    showLoading("Unknown ticker: " + t); return; 
  }
  await loadStock(t);
}

function buyShare() {
  let qty = parseFloat(quantityInput.value());
  if (isNaN(qty) || qty <= 0) return;
  
  let cost = qty * currentPrice;
  if (!isLoading && cash >= cost) {
    shares += qty;
    cash -= cost;
    holdings.set(stock, shares);
    savePortfolio();
  }
}

function sellShare() {
  let qty = parseFloat(quantityInput.value());
  if (isNaN(qty) || qty <= 0) return;

  if (!isLoading && shares >= qty) {
    shares -= qty;
    cash += qty * currentPrice;
    if (shares === 0) {
      holdings.delete(stock);
    } 
    else {
      holdings.set(stock, shares);
    }
    savePortfolio();
  }
}

function resetPort() {
  if (confirm("Are you sure you want to clear your current portfolio holdings and balance configurations?")) {
    cash = startingCash;
    shares = 0;
    holdings.clear();
    savePortfolio();
    clearSim();
  }
}

function addSim() {
  if (chartMode === "line") {
    addSimPath(); 
    redrawAll(); 
  } 
}

function infoTab() {
  showInfo = !showInfo;
  redrawAll();
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

function addSimPath() {
  if (closePrices.length === 0) {
    return;
  }

  let futurePrices = generatePrice(closePrices, 0.0003, 0.02, 100, simStepsPerPath);
  let futureDates  = generateFutureDates(dateLabels[dateLabels.length - 1], simStepsPerPath);
  let fullCloses   = [...closePrices, ...futurePrices.slice(closePrices.length)];
  let fullDates    = [...dateLabels,  ...futureDates];

  let hue = pickDistinctHue();
  colorMode(HSB, 360, 100, 100);
  let c = color(hue, 80, 90);
  colorMode(RGB, 255);
  let col = [red(c), green(c), blue(c)];

  simPaths.push({ closes: fullCloses, dates: fullDates, col, hue });
  simTotalFrames = simStepsPerPath;
  if (simPaths.length === 1) {
    simFrame = 0; simPlaying = false; 
  }

  simMode = true;
  updateSimButtonVisibility();
}

function pickDistinctHue() {
  let forbidden = [0, 15, 345, 120, 130];
  let candidate = (simPaths.length * 53 + 200) % 360;
  while (forbidden.some(h => abs(candidate - h) < 25)) {
    candidate = (candidate + 37) % 360;
  }
  return candidate;
}

function generateFutureDates(lastDateStr, steps) {
  let dates = [];
  let d = new Date(lastDateStr);
  for (let i = 0; i < steps; i++) {
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function clearSim() {
  simPaths = []; simMode = false; simPlaying = false; simFrame = 0;
  updateSimButtonVisibility();
  redrawAll();
}

function playSim()  {
  if (simMode && simPaths.length > 0) {
    simPlaying = true;
  } 
}
function pauseSim() {
  simPlaying = false; 
}
function fwdSim()   {
  simFrame = min(simFrame + 10, simTotalFrames); redrawAll(); 
}

function parseHistoricalData(data, length = 600) {
  someData = [];
  for (let i = data.length - length; i < data.length; i++) {
    someData.push(data[i].close);
  }
  return someData;
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
  resizeCanvas(max(800, windowWidth), max(450, windowHeight));
  repositionButtons();
  redrawAll();
}

// --- Keyboard and scroll wheel input --------------------------------

function keyPressed() {
  // Check if Enter is pressed and the input box is currently active
  if (keyCode === ENTER && document.activeElement === tickerInput.elt) {
    handleLoad();
  }
}