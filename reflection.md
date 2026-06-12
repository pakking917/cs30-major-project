# Reflection

**What advice would you give to yourself if you were to start a project like this again?**
Looking back, I should've offloaded a lot of my styling and layout into the CSS files. My stubborn refusal to relearn CSS has probably costed me a lot of time and made my code a lot less readable and efficient. I would have also liked to gained a bit more knowledge of financial API keys and fetching JSON data before diving in.


**Did you complete everything in your “needs to have” list?**
Yes, I completed almost every core requirement. The only thing that I realized was not possible during development was the streaming continuous, live price updates. Commerical finance data streams require incredibly expensive subscriptions. Flooding an open APi endpoint with high frequency requests would have quicklyt drained my rate limits and resulted in significant financial costs, not to mention that it would be very laggy as it is due to communication delays with the web proxy. I compromised by combining the 250 day historical data with fresh single pull current pricing so that it only uses a small amount of API calls.


**What was the hardest part of the project?**
The hardest part was setting up the network pipelines and getting the simulator to communicate with teh external API. I had spent a lot of time figuring out the documentation and steps required to use a Vercel web proxy to hide my API key. The Cross-Origin Resource Sharing error also gave me a lot of grief, since its mechanism was somewhat convoluted and changes with differnet ports. My solution was to adjust my web proxy to securely handle the headers and bypass these restrictions.


**Were there any problems you could not solve?**
I only had a few minor features and data limitations that remained unresolved. My applyStrategy function that I intended to compare the user's investment strategy to a more algorithmic strategy was not robust. Additionally, due to the restrictions of the free API tier, I couldn't dynamically pull full company names or secure true intraday data streams. I had to accept using a static ticker verification library and mostly rely on daily closing prices as my data anchor.
