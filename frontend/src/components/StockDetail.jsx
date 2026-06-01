import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const RANGES = [
  { label: '1일', value: '1d' }, { label: '5일', value: '5d' }, { label: '1개월', value: '1mo' },
  { label: '6개월', value: '6mo' }, { label: '1년', value: '1y' }, { label: '5년', value: '5y' },
];

const formatTime = (ts, range) => {
  const d = new Date(ts);
  if (range === '1d') return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (range === '5d') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const fmtNum = (val, currency) => {
  if (val == null) return '-';
  if (currency === 'KRW') return val.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtCap = val => {
  if (!val) return '-';
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9)  return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6)  return `${(val / 1e6).toFixed(2)}M`;
  return val.toLocaleString();
};

const CustomTooltip = ({ active, payload, label, range, currency, isSpecial }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-lg px-3 py-2 text-sm shadow-xl border ${isSpecial ? 'bg-white border-purple-200 text-gray-800' : 'bg-slate-900 border-slate-600 text-white'}`}>
      <div className={isSpecial ? 'text-purple-400' : 'text-slate-400'}>{formatTime(label, range)}</div>
      <div className="font-semibold">{fmtNum(payload[0].value, currency)}</div>
    </div>
  );
};

export default function StockDetail({ symbol, name, onClose }) {
  const isSpecial = useTheme();
  const [range, setRange] = useState('1d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    axios.get(`/api/quote/${encodeURIComponent(symbol)}?range=${range}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('데이터를 불러올 수 없습니다.'); setLoading(false); });
  }, [symbol, range]);

  const chartData = data?.chartData || [];
  const isUp = data ? data.change >= 0 : true;
  const strokeColor = isSpecial
    ? (isUp ? '#059669' : '#dc2626')
    : (isUp ? '#34d399' : '#f87171');

  const prices = chartData.map(d => d.price).filter(Boolean);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const pad  = (maxP - minP) * 0.05 || 1;

  const cardCls = isSpecial
    ? 'bg-white/80 backdrop-blur-sm rounded-xl border-2 border-purple-200 p-6 mt-6 shadow-md'
    : 'bg-slate-800 rounded-xl border border-slate-700 p-6 mt-6';
  const titleCls   = isSpecial ? 'text-gray-800'   : 'text-white';
  const tagCls     = isSpecial ? 'bg-purple-100 text-purple-700' : 'bg-slate-700 text-slate-300';
  const exchangeCls= isSpecial ? 'text-gray-400'   : 'text-slate-500';
  const tickColor  = isSpecial ? '#9333ea'          : '#64748b';
  const gridColor  = isSpecial ? '#f3e8ff'          : '#1e293b';
  const axisColor  = isSpecial ? '#d8b4fe'          : '#334155';
  const btnActive  = isSpecial ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white';
  const btnInactive= isSpecial ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-slate-700 text-slate-400 hover:bg-slate-600';
  const statCls    = isSpecial ? 'bg-purple-50/80 rounded-lg p-3' : 'bg-slate-900/60 rounded-lg p-3';
  const statLabel  = isSpecial ? 'text-xs text-purple-500 mb-1'   : 'text-xs text-slate-400 mb-1';
  const statValue  = isSpecial ? 'text-sm font-semibold text-gray-800' : 'text-sm font-semibold text-white';
  const upCls      = isSpecial ? (isUp ? 'text-emerald-600' : 'text-red-500') : (isUp ? 'text-emerald-400' : 'text-red-400');

  return (
    <div className={cardCls}>
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`text-lg sm:text-xl font-bold ${titleCls}`}>{data?.name || name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${tagCls}`}>{symbol}</span>
            {data?.exchange && <span className={`text-xs shrink-0 ${exchangeCls}`}>{data.exchange}</span>}
          </div>
          {loading && <div className={`text-sm mt-1 ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>로딩 중...</div>}
          {!loading && data && (
            <div className="flex items-baseline gap-2 flex-wrap mt-2">
              <span className={`text-2xl sm:text-3xl font-bold ${upCls}`}>
                {fmtNum(data.price, data.currency)}
                <span className={`text-sm font-normal ml-1 ${isSpecial ? 'text-gray-400' : 'text-slate-400'}`}>{data.currency}</span>
              </span>
              <span className={`text-sm font-medium ${upCls}`}>
                {isUp ? '+' : ''}{fmtNum(data.change, data.currency)} ({isUp ? '+' : ''}{data.changePct?.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <button onClick={onClose} className={`text-xl transition-colors leading-none shrink-0 ${isSpecial ? 'text-purple-300 hover:text-purple-600' : 'text-slate-400 hover:text-white'}`}>✕</button>
      </div>

      {error && <div className="text-red-400 text-sm my-4">{error}</div>}

      {!error && (
        <>
          <div className="flex gap-1 flex-wrap mb-4">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === r.value ? btnActive : btnInactive}`}>
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className={`flex items-center justify-center h-52 ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>
              <span className="animate-spin text-xl mr-2">⟳</span> 로딩 중...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="time" tickFormatter={ts => formatTime(ts, range)}
                  tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: axisColor }} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[minP - pad, maxP + pad]}
                  tickFormatter={val => fmtNum(val, data?.currency).split('.')[0]}
                  tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: axisColor }} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip range={range} currency={data?.currency} isSpecial={isSpecial} />} />
                <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2}
                  fill="url(#stockGrad)" dot={false}
                  activeDot={{ r: 4, fill: strokeColor, stroke: isSpecial ? '#fff' : '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`flex items-center justify-center h-52 ${isSpecial ? 'text-purple-400' : 'text-slate-500'}`}>데이터 없음</div>
          )}
        </>
      )}

      {data && !loading && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {[
            { label: '전일 종가', value: fmtNum(data.prevClose, data.currency) },
            { label: '당일 최고', value: fmtNum(data.dayHigh, data.currency) },
            { label: '당일 최저', value: fmtNum(data.dayLow, data.currency) },
            { label: '52주 최고', value: fmtNum(data.fiftyTwoWeekHigh, data.currency) },
            { label: '52주 최저', value: fmtNum(data.fiftyTwoWeekLow, data.currency) },
            { label: '시가총액',  value: fmtCap(data.marketCap) },
          ].map(({ label, value }) => (
            <div key={label} className={statCls}>
              <div className={statLabel}>{label}</div>
              <div className={statValue}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
