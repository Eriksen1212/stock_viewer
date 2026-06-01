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
      params: { q: q.trim(), quotesCount: 8, newsCount: 0, enableFuzzyQuery: false, enableCb: false },
      timeout: 8000,
    });
    const quotes = (data.quotes || [])
      .filter(q => q.quoteType && ['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND'].includes(q.quoteType))
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || q.exchange,
        type: q.quoteType,
      }));
    res.json(quotes);
  } catch {
    res.json([]);
  }
};
