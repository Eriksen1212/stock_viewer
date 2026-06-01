const { fetchQuote } = require('./_lib/yahoo');

const INDICES = {
  nasdaq100: { symbol: '^NDX', name: 'NASDAQ 100', currency: 'USD' },
  sp500: { symbol: '^GSPC', name: 'S&P 500', currency: 'USD' },
  dow: { symbol: '^DJI', name: 'Dow Jones', currency: 'USD' },
  kospi: { symbol: '^KS11', name: 'KOSPI', currency: 'KRW' },
  kosdaq: { symbol: '^KQ11', name: 'KOSDAQ', currency: 'KRW' },
};

module.exports = async function handler(req, res) {
  try {
    const results = await Promise.all(
      Object.entries(INDICES).map(async ([key, info]) => {
        try {
          const result = await fetchQuote(info.symbol);
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          const change = price - prevClose;
          const changePct = (change / prevClose) * 100;

          return {
            key,
            symbol: info.symbol,
            name: info.name,
            currency: info.currency,
            price,
            change,
            changePct,
            prevClose,
            dayHigh: meta.regularMarketDayHigh,
            dayLow: meta.regularMarketDayLow,
            volume: meta.regularMarketVolume,
            marketTime: meta.regularMarketTime,
          };
        } catch {
          return { key, symbol: info.symbol, name: info.name, currency: info.currency, error: true };
        }
      })
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
