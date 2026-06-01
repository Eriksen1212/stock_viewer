const { fetchHistory } = require('../_lib/yahoo');

const INDICES = {
  nasdaq100: { symbol: '^NDX', name: 'NASDAQ 100', currency: 'USD' },
  sp500: { symbol: '^GSPC', name: 'S&P 500', currency: 'USD' },
  dow: { symbol: '^DJI', name: 'Dow Jones', currency: 'USD' },
  kospi: { symbol: '^KS11', name: 'KOSPI', currency: 'KRW' },
  kosdaq: { symbol: '^KQ11', name: 'KOSDAQ', currency: 'KRW' },
};

const intervalMap = {
  '1d': '5m',
  '5d': '30m',
  '1mo': '1d',
  '6mo': '1wk',
  '1y': '1wk',
  '5y': '1mo',
};

module.exports = async function handler(req, res) {
  const { key } = req.query;
  const { range = '1d' } = req.query;
  const info = INDICES[key];

  if (!info) return res.status(404).json({ error: 'Index not found' });

  try {
    const result = await fetchHistory(info.symbol, range, intervalMap[range] || '1d');
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];

    const chartData = timestamps
      .map((ts, i) => ({
        time: ts * 1000,
        price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
      }))
      .filter(d => d.price !== null);

    res.json({ key, name: info.name, currency: info.currency, range, data: chartData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
