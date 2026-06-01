const axios = require('axios');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
  const params = { interval: '1m', range: '1d', includePrePost: false };
  const { data } = await axios.get(url, { headers: YF_HEADERS, params, timeout: 10000 });
  return data.chart.result[0];
}

async function fetchHistory(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
  const params = { interval, range, includePrePost: false };
  const { data } = await axios.get(url, { headers: YF_HEADERS, params, timeout: 10000 });
  return data.chart.result[0];
}

module.exports = { fetchQuote, fetchHistory };
