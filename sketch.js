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

let simulationPrices = [];

async function setup() {
  createCanvas(windowWidth, windowHeight);
  // let stockData = await grabCurrentPrice(stock);
  // currentPrice = stockData.close;
  // console.log(stockData);
  // console.log(currentPrice);

  simulationPrices = generatePrice(1);
  console.log(simulationPrices);
  drawGraph(simulationPrices);
  endData = applyStrategy(simulationPrices, 14, 14);
  let endBalance = endData.finalCash;
  let shares = endData.finalShares;
  let endPrice = endData.finalPrice;
  let portValue = endData.endingValue;
  
  console.log(`Ending Balance: $${endBalance.toFixed(2)}, Ending Price: $${endPrice.toFixed(2)}, Shares: ${shares.toFixed(2)}`);
  console.log(`Portfolio value: $${portValue.toFixed(2)}`);

  console.log(calculateRSIArray(simulationPrices, 14)[simulationPrices.length - 1], simulationPrices[simulationPrices.length - 1]);
  console.log(portValue, simulationPrices[simulationPrices.length - 1] * 1000);

  let counter = 0;
  let stratTotal = 0;
  let endTotal = 0;
  for (let i = 0; i < 100; i++) {
    let tempPrice = generatePrice(1);
    portValue = applyStrategy(tempPrice, 14, 14).endingValue;
    if (portValue > tempPrice[tempPrice.length - 1] * 1000) counter++;
    stratTotal += portValue;
    endTotal += tempPrice[tempPrice.length - 1] * 1000;
  }
  console.log(counter, stratTotal, endTotal);


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
  simulatedPrices = generatePrice(currentPrice);
}



function buyShare() {
  if (cash >= currentPrice) {
    share++;
    cash -= currentPrice;
  }
}

function drawGraph(priceArray) {
  let graphX = 50;
  let graphY = 50;
  
  let graphW = width - graphX * 2;
  let graphH = height - graphY * 2;
  
  // Border
  stroke(255);
  noFill();
  
  rect(graphX, graphY, graphW, graphH);
  
  // Draw current price line
  stroke(0, 255, 0);
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
  let link = `https://stock-proxy-umber.vercel.app/api/stock?ticker=${ticker}`;
  // link = `https://eodhd.com/api/eod/${ticker}.US?api_token=69f8c9abe7ea52.17961877&fmt=json`;
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

function generatePrice(initialPrice, averageReturn = 0.0003, volatility = 0.02, totalTime = 100, steps = 600) {
  let prices = [initialPrice];
  let currentPrice = initialPrice;

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
    100 - (100 / (1 + (avgGain / avgLoss)));
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
      rsiArray[i] = 100 - (100 / (1 + rs));
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
      // Goes "all in" with whatever cash is available
      const sharesToBuy = cash / currentPrice; 
      shares += sharesToBuy;
      // console.log(`Buy at: $${currentPrice.toFixed(2)} | Invested: $${cash.toFixed(2)}`);
      cash = 0; 
    } 
    else if (currentRSI > 70 && shares > 0) { 
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