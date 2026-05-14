// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let data;
let stockPrices = [];
let currentPrice = 0;

let cash = 10000;

let stock = "NVDA";
let stockData;
let shares = 0;
let portfolioValue = 0;

let simulationPrices = [1];






function setup() {
  createCanvas(windowWidth, windowHeight);
  let stockData = grabCurrentPrice(stock);
  currentPrice = stockData.close;
  console.log(stockData);
  console.log(currentPrice);
}

function draw() {
  background(220);
  circle(mouseX, mouseY, 50);
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
  simulatedPrices = generatePrice(currentPrice);
}


function generatePrice(initialPrize, averageReturn = 0.0003, dStep = 1 / 86400, steps = 365, volatility = 0.02) {
  let prices = [initialPrize];
  let currentPrice = initialPrize;
  for (let i = 0; i < steps; i += dStep) {

    //
    let u1 = random();
    let u2 = random();
    let z0 = Math.sqrt(-2 * Math.log(u1)) *  Math.cos(TAU * u2);

    let dailyReturn = averageReturn + volatility * z0;
    let drift = (averageReturn - 0.5 * Math.pow(dStep, 2)) * dStep;
    let diffusion = averageReturn * Math.sqrt(dStep) * z0;
    let change = Math.exp(drift + diffusion);

  }


}

function buyShare() {
  if (cash >= currentPrice) {
    share++;
    cash -= currentPrice;
  }
}

function drawGraph() {
  let graphX = 50;
  let graphY = 50;

  let graphW = width - graphX * 2;
  let graphH = height - graphY * 2;

  rect(graphX, graphY, graphW, graphH);

  for (let i = 0; i < simulationPrices.length; i++) {
    let x = map();
    let y = map();
  }
}


function grabCurrentPrice(ticker) {
  let link = `https://stock-proxy-umber.vercel.app/api/stock?ticker=${ticker}`;
  link = `https://eodhd.com/api/real-time/${ticker}.US?api_token=demo&fmt=json`;
  const data = getData(link);
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


function tempGenPrices() {
  for (i = 0; i < 100; )
}