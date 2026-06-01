const { fetchHistory } = require('../_lib/yahoo');

const intervalMap = {
  '1d': '5m',
  '5d': '30m',
  '1mo': '1d',
  '6mo': '1wk',
  '1y': '1wk',
  '5y': '1mo',
};

module.exports = async function handler(req, res) {
  const { symbol } = req.query;
  const { range = '1d' } = req.query;

  try {
    const result = await fetchHistory(symbol, range, intervalMap[range] || '1d');
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;

    const chartData = timestamps
      .map((ts, i) => ({
        time: ts * 1000,
        price: closes[i] ? parseFloat(closes[i].toFixed(4)) : null,
      }))
      .filter(d => d.price !== null);

    res.json({
      symbol,
      name: meta.longName || meta.shortName || symbol,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName,
      price,
      change,
      changePct,
      prevClose,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      range,
      chartData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
