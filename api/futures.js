const { fetchQuote } = require('./_lib/yahoo');

const ALL_FUTURES = [
  { symbol: 'ES=F',      name: 'S&P 500 E-mini',        category: 'indices' },
  { symbol: 'NQ=F',      name: 'NASDAQ 100 E-mini',      category: 'indices' },
  { symbol: 'YM=F',      name: '다우존스 E-mini',         category: 'indices' },
  { symbol: 'RTY=F',     name: '러셀 2000 E-mini',        category: 'indices' },
  { symbol: 'GC=F',      name: '금 (Gold)',               category: 'commodities' },
  { symbol: 'SI=F',      name: '은 (Silver)',             category: 'commodities' },
  { symbol: 'CL=F',      name: 'WTI 원유',                category: 'commodities' },
  { symbol: 'NG=F',      name: '천연가스',                 category: 'commodities' },
  { symbol: 'HG=F',      name: '구리 (Copper)',            category: 'commodities' },
  { symbol: 'PL=F',      name: '백금 (Platinum)',          category: 'commodities' },
  { symbol: '6E=F',      name: '유로 (EUR/USD)',           category: 'currencies' },
  { symbol: '6J=F',      name: '엔화 (JPY/USD)',           category: 'currencies' },
  { symbol: '6B=F',      name: '파운드 (GBP/USD)',         category: 'currencies' },
  { symbol: '6A=F',      name: '호주달러 (AUD/USD)',        category: 'currencies' },
  { symbol: 'ZN=F',      name: '미 10년 국채',             category: 'bonds' },
  { symbol: 'ZB=F',      name: '미 30년 국채',             category: 'bonds' },
  { symbol: 'BTC=F',     name: '비트코인 선물 (CME)',       category: 'crypto' },
  { symbol: '005930.KS', name: '삼성전자',                 category: 'korea' },
  { symbol: '000660.KS', name: 'SK하이닉스',               category: 'korea' },
  { symbol: '^KS11',     name: 'KOSPI 지수',               category: 'korea' },
  { symbol: '^KQ11',     name: 'KOSDAQ 지수',              category: 'korea' },
];

module.exports = async function handler(req, res) {
  const results = await Promise.all(
    ALL_FUTURES.map(async item => {
      try {
        const result = await fetchQuote(item.symbol);
        const meta = result.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
        const change = price - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        return {
          ...item,
          currency: meta.currency || 'USD',
          price,
          change,
          changePct,
          dayHigh: meta.regularMarketDayHigh,
          dayLow: meta.regularMarketDayLow,
        };
      } catch {
        return { ...item, error: true };
      }
    })
  );
  res.json(results);
};
