const axios = require('axios');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

module.exports = async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);

  try {
    const url = 'https://query1.finance.yahoo.com/v1/finance/search';
    const { data } = await axios.get(url, {
      headers: YF_HEADERS,
      params: { q: q.trim(), quotesCount: 12, newsCount: 0, enableFuzzyQuery: false, enableCb: false },
      timeout: 8000,
    });
    const quotes = (data.quotes || [])
      .filter(item => item.quoteType && ['FUTURE', 'EQUITY', 'ETF', 'INDEX'].includes(item.quoteType))
      .map(item => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || item.symbol,
        exchange: item.exchDisp || item.exchange,
        type: item.quoteType,
      }));
    res.json(quotes);
  } catch {
    res.json([]);
  }
};
