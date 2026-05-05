// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let data;
let stockPrices = [];
let currentPrice = 0;

let cash = 1000;
let stock 

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  circle(mouseX, mouseY, 50);
}


function drawGraph() {}

function generatePrice(initialPrize, averageReturn = 0.0003, dStep = 1 / 86400, steps = 365) {
  let prices = [initialPrize];
  let currentPrice = initialPrize;
  for (let i = 0; i < steps; i += dStep) {

    // 
    let z0 = Math.sqrt(-2 * Math.log(random())) *  Math.cos(TAU * random());

    let drift = (averageReturn - 0.5 * Math.pow(dStep, 2)) * dStep;
    let diffusion = averageReturn * Math.sqrt(dStep) * z0;
    let change = Math.exp(drift + diffusion);

  }


}

grabCurrentPrice(ticker) {
  let data = `https://stock-proxy-umber.vercel.app/api/stock?ticker=${ticker}`;
}

async function getData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } 
  catch (error) {
    console.error("Error fetching data:", error);
  }
}
