const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const INDICES = {
  nasdaq100: { symbol: '^NDX', name: 'NASDAQ 100', currency: 'USD' },
  sp500: { symbol: '^GSPC', name: 'S&P 500', currency: 'USD' },
  dow: { symbol: '^DJI', name: 'Dow Jones', currency: 'USD' },
  kospi: { symbol: '^KS11', name: 'KOSPI', currency: 'KRW' },
  kosdaq: { symbol: '^KQ11', name: 'KOSDAQ', currency: 'KRW' },
};

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

// 전체 지수 현재가 조회
app.get('/api/indices', async (req, res) => {
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
});

// 단일 지수 차트 데이터
app.get('/api/chart/:key', async (req, res) => {
  const { key } = req.params;
  const { range = '1d' } = req.query;
  const info = INDICES[key];

  if (!info) return res.status(404).json({ error: 'Index not found' });

  const intervalMap = {
    '1d': '5m',
    '5d': '30m',
    '1mo': '1d',
    '6mo': '1wk',
    '1y': '1wk',
    '5y': '1mo',
  };

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
});

// 환율 (원화 기준) + 달러 인덱스
const FOREX_PAIRS = [
  { symbol: 'USDKRW=X', base: 'USD', name: '미국 달러',   flag: '🇺🇸' },
  { symbol: 'EURKRW=X', base: 'EUR', name: '유로',        flag: '🇪🇺' },
  { symbol: 'JPYKRW=X', base: 'JPY', name: '일본 엔',     flag: '🇯🇵' },
  { symbol: 'GBPKRW=X', base: 'GBP', name: '영국 파운드', flag: '🇬🇧' },
  { symbol: 'CNYKRW=X', base: 'CNY', name: '중국 위안',   flag: '🇨🇳' },
  { symbol: 'CHFKRW=X', base: 'CHF', name: '스위스 프랑', flag: '🇨🇭' },
  { symbol: 'AUDKRW=X', base: 'AUD', name: '호주 달러',   flag: '🇦🇺' },
  { symbol: 'HKDKRW=X', base: 'HKD', name: '홍콩 달러',   flag: '🇭🇰' },
];

app.get('/api/forex', async (req, res) => {
  try {
    const results = await Promise.all([
      // 원화 환율 쌍
      ...FOREX_PAIRS.map(async pair => {
        try {
          const result = await fetchQuote(pair.symbol);
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
          const change = price - prevClose;
          const changePct = (change / prevClose) * 100;
          return {
            type: 'forex',
            symbol: pair.symbol,
            base: pair.base,
            name: pair.name,
            flag: pair.flag,
            rate: price,
            change,
            changePct,
            prevClose,
            dayHigh: meta.regularMarketDayHigh,
            dayLow: meta.regularMarketDayLow,
          };
        } catch {
          return { type: 'forex', symbol: pair.symbol, base: pair.base, name: pair.name, flag: pair.flag, error: true };
        }
      }),
      // 달러 인덱스 (DXY)
      (async () => {
        try {
          const result = await fetchQuote('DX-Y.NYB');
          const meta = result.meta;
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
          const change = price - prevClose;
          const changePct = (change / prevClose) * 100;
          return {
            type: 'dxy',
            symbol: 'DX-Y.NYB',
            base: 'DXY',
            name: '달러 인덱스',
            flag: '📊',
            rate: price,
            change,
            changePct,
            prevClose,
            dayHigh: meta.regularMarketDayHigh,
            dayLow: meta.regularMarketDayLow,
          };
        } catch {
          return { type: 'dxy', symbol: 'DX-Y.NYB', base: 'DXY', name: '달러 인덱스', flag: '📊', error: true };
        }
      })(),
    ]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 종목 검색 자동완성
app.get('/api/search', async (req, res) => {
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
  } catch (err) {
    // Yahoo Finance가 한글 등 비ASCII 쿼리에 400을 반환할 수 있음 → 빈 결과로 처리
    res.json([]);
  }
});

// 개별 종목 현재가 + 기본 정보
app.get('/api/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { range = '1d' } = req.query;

  const intervalMap = {
    '1d': '5m', '5d': '30m', '1mo': '1d',
    '6mo': '1wk', '1y': '1wk', '5y': '1mo',
  };

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
});

app.listen(PORT, () => {
  console.log(`Stock API server running on http://localhost:${PORT}`);
});
