const { fetchQuote } = require('./_lib/yahoo');

const CATEGORIES = {
  korea: [
    { symbol: '005930.KS', name: '삼성전자' },
    { symbol: '000660.KS', name: 'SK하이닉스' },
    { symbol: '035420.KS', name: 'NAVER' },
    { symbol: '035720.KS', name: '카카오' },
    { symbol: '005380.KS', name: '현대차' },
    { symbol: '000270.KS', name: '기아' },
    { symbol: '068270.KS', name: '셀트리온' },
    { symbol: '373220.KS', name: 'LG에너지솔루션' },
    { symbol: '105560.KS', name: 'KB금융' },
    { symbol: '005490.KS', name: 'POSCO홀딩스' },
  ],
  us: [
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'AMD', name: 'AMD' },
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'PLTR', name: 'Palantir' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'INTC', name: 'Intel' },
  ],
  etf: [
    { symbol: 'SPY', name: 'SPDR S&P500' },
    { symbol: 'QQQ', name: 'Invesco NASDAQ 100' },
    { symbol: 'IWM', name: 'iShares Russell 2000' },
    { symbol: 'GLD', name: 'SPDR Gold' },
    { symbol: 'TLT', name: 'iShares 20Y+ 국채' },
    { symbol: 'ARKK', name: 'ARK Innovation' },
    { symbol: '360750.KS', name: 'TIGER 미국S&P500' },
    { symbol: '133690.KS', name: 'TIGER 미국나스닥100' },
    { symbol: 'XLF', name: 'Financial Select SPDR' },
    { symbol: 'VNQ', name: 'Vanguard 리츠 ETF' },
  ],
  leverage: [
    { symbol: 'TQQQ', name: 'ProShares Ultra QQQ 3x' },
    { symbol: 'SQQQ', name: 'ProShares Short QQQ 3x' },
    { symbol: 'SOXL', name: 'Direxion 반도체 Bull 3x' },
    { symbol: 'UPRO', name: 'ProShares S&P500 3x' },
    { symbol: 'SPXU', name: 'ProShares S&P500 Bear 3x' },
    { symbol: 'TECL', name: 'Direxion 테크 Bull 3x' },
    { symbol: '122630.KS', name: 'KODEX 레버리지' },
    { symbol: '252670.KS', name: 'KODEX 200선물인버스2X' },
    { symbol: 'LABU', name: 'Direxion 바이오 Bull 3x' },
    { symbol: 'FAS', name: 'Direxion 금융 Bull 3x' },
  ],
};

module.exports = async function handler(req, res) {
  const { category = 'korea' } = req.query;
  const list = CATEGORIES[category];
  if (!list) return res.status(400).json({ error: 'Invalid category' });

  const results = await Promise.all(
    list.map(async ({ symbol, name }) => {
      try {
        const result = await fetchQuote(symbol);
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
        const change = price - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        return {
          symbol,
          name,
          currency: meta.currency || 'USD',
          price,
          change,
          changePct,
          volume: meta.regularMarketVolume || 0,
          dayHigh: meta.regularMarketDayHigh,
          dayLow: meta.regularMarketDayLow,
        };
      } catch {
        return { symbol, name, error: true, volume: 0 };
      }
    })
  );

  results.sort((a, b) => (b.volume || 0) - (a.volume || 0));
  res.json(results);
};
