const { fetchQuote } = require('./_lib/yahoo');

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

module.exports = async function handler(req, res) {
  try {
    const results = await Promise.all([
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
};
