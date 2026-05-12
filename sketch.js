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

}

function updateSystem() {

}


function drawGraph() {}

function generatePrice(initialPrize, averageReturn = 0.0003, dStep = 1 / 86400, steps = 365) {
  let prices = [initialPrize];
  let currentPrice = initialPrize;
  for (let i = 0; i < steps; i += dStep) {

    //
    let u1 = random(0, 1);
    let u2 = random(0, 1);
    let z0 = Math.sqrt(-2 * Math.log(random())) *  Math.cos(TAU * random());

    let drift = (averageReturn - 0.5 * Math.pow(dStep, 2)) * dStep;
    let diffusion = averageReturn * Math.sqrt(dStep) * z0;
    let change = Math.exp(drift + diffusion);

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
