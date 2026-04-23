# Project description
An interactive stock market simulator that will allow the user to buy and sell stocks according to real-life or simulated data. It will also visualize price movement and portfolio performance over time. It will allow users to create a portfolio and compare their strategies to different common strategies to practice investing.

This project will feature a dynamic graphing system that diplay stock prices, changes, and user transactions. It will update profit, loss, and total value in real time. Users can also simulate different investment strategies to see how their decisions impact long-term returns.

The program will also include a statistical simulation using components like Monte Carlo methods to generate hypothetical possible future price paths based on historical trends.

The goal of this project is to build a semi-educational tool that combines mathematical modeling with interactive visualization to better inform users with their investing choices and show the volatility and unpredictability of the stock market. 


## Needs to Have
**Stock Data System**  

- Load real time (or slightly delayed) stock prices data (Possibly with APIs)  

- Store and update data efficiently  

- Display stock prices as continuous graphs  

- Allow users to pick and switch between stocks  


**Graphing & Visualization**
- Render a real-time updating line graph of stock prices
- Scale graph dynamically based on data range
- Display axes, labels, and time intervals

**Trading System**
- Allow user to buy stocks at current price
- Allow user to sell stocks
- Track number of shares owned
- Track available cash balance
- Calculate and display total portfolio value
- Display profit/loss over time

**Simulation Engine**
- Simulate stock price movement as an alternative for real data 
- Implement randomness to mimic market fluctuations
- Allow simulation speed control (pause/play/fast-forward)

**Monte Carlo Forecasting**
- Generate multiple possible future price paths using statistical methods
- Base simulations on historical average return and volatility
- Display multiple simulated paths visually on the graph
- Highlight average or expected outcome

**User Interface**
- Create buttons for buy, sell, pause, and reset
- Display key information (price, portfolio value, profit/loss)
- Allow user input for starting cash or investment amount

## Nice to Have

- Overlay user actions (buy/sell points) on graph
- Include advanced investing options beyond buing and selling (shorting, market order, limit order, stop-loss, etc.)
- Multiple stock comparison (track several stocks at once)
- Different investment strategies (e.g., buy-and-hold vs periodic investing)
- Moving averages or technical indicators displayed on graph
- Save/load portfolio state over multiple devices (probably computers)
- News/event system that affects simulated prices
- Risk metrics such as volatility or maximum drawdown
- Candlestick chart visualization instead of simple line graph
- User-controlled parameters for Monte Carlo simulation (number of trials, volatility)
- Performance comparison between user decisions and automated strategies
- Polished UI with animations and transitions