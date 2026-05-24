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

function setup() {
  createCanvas(windowWidth, windowHeight);
  // let stockData = grabCurrentPrice(stock);
  // currentPrice = stockData.close;
  // console.log(stockData);
  // console.log(currentPrice);

  // simulationPrices = tempGenPrices(1);
  // let endData = applyStrategy(simulationPrices, 14, 14);
  // let endBalance = endData[0];
  // let shares = endData[2];
  // let endPrice = endData[1];
  
  // console.log(`Ending Balance: $${endBalance.toFixed(2)}, Ending Price: $${endPrice.toFixed(2)}, Shares: ${shares.toFixed(2)}`);
  // console.log(`Portfolio value: $${(endBalance + shares * endPrice).toFixed(2)}`)
  // drawGraph(simulationPrices);

  // console.log(buyDipSellHigh(simulationPrices, 14), simulationPrices[simulationPrices.length - 1]);

  let counter = 0;
  let total = 0;
  for (let i = 0; i < 100; i++) {
    let tempPath = tempGenPrices(1);
    let endData = applyStrategy(tempPath, 14, 14);
    console.log(endData);
    let endBalance = endData[0];
    let shares = endData[2];
    let endPrice = endData[1];
    let portValue = endBalance + shares * endPrice;
    if (portValue > 1000) counter++;
    total += portValue;
  }
  console.log(counter);
  console.log(total/100);

  // let counter = 0;
  // for (let i = 0; i < 10000; i++) {
  //   const skibidi = tempGenPrices(1);
  //   counter += comparePrice(skibidi);
  //   console.log(buyDipSellHigh(skibidi, 14), skibidi[skibidi.length - 1]);
  // }
  // console.log(counter);
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
  link = `https://eodhd.com/api/real-time/${ticker}.US?api_token=demo&fmt=json`;
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


function tempGenPrices(initialPrice, averageReturn = 0.00003, volatility = 0.02, steps = 200) {
  let prices = [initialPrice];
  let current = initialPrice;
  
  for (let i = 0; i < steps; i++) {
    
    let u1 = random();
    let u2 = random();
    
    let z = sqrt(-2 * log(u1)) * cos(TAU * u2);
    
    let dailyReturn = averageReturn + volatility * z;
    
    current *= exp(dailyReturn);
    prices.push(current);
  }
  
  return prices;
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

function comparePrice(priceArray) {
  return priceArray[priceArray.length - 1] > priceArray[0];
}

function buyDipSellHigh(priceArray, periods) {
  if (!priceArray || priceArray.length <= periods) {
    return null;
  }

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
  }


  const rs = avgGain/avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  if (rsi > 70) {
    return 'sell';
  }
  else if (rsi < 30) {
    return 'buy';
  }
  else {
    return 'hold';
  }
}

function applyStrategy(priceArray, periods, startPeriods) {
  let shares = 0;
  let cash = 1000;


  for (let i = startPeriods; i < priceArray.length; i++) {
    let currentHistory = priceArray.slice(0, i + 1);
    const action = buyDipSellHigh(currentHistory, periods);
    const currentPrice = priceArray[i];
    if (action === 'buy') {
      const sharesToBuy = 1000 / currentPrice;
      shares += sharesToBuy;
      cash -= 1000;
      console.log(`buy at: $${currentPrice.toFixed(2)}, Cash: ${cash}, Value: ${cash + shares * currentPrice}`);
    } 
    else if (action === 'sell' && shares > 0) { 
      cash += shares * currentPrice;
      console.log(`sell at: $${currentPrice.toFixed(2)} | Liquidated: ${shares.toFixed(2)} shares`);
      shares = 0;
    }
  }

  const finalPrice = priceArray[priceArray.length - 1];
  const endingBalance = cash + shares * finalPrice;
  
  return [cash, finalPrice, shares, endingBalance];
}