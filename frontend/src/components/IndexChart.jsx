import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const RANGES = [
  { label: '1일', value: '1d' },
  { label: '5일', value: '5d' },
  { label: '1개월', value: '1mo' },
  { label: '6개월', value: '6mo' },
  { label: '1년', value: '1y' },
  { label: '5년', value: '5y' },
];

const formatTime = (ts, range) => {
  const d = new Date(ts);
  if (range === '1d') return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (range === '5d') return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const CustomTooltip = ({ active, payload, label, range, currency, isSpecial }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted = currency === 'KRW'
    ? val.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
    : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className={`rounded-lg px-3 py-2 text-sm shadow-xl border ${isSpecial ? 'bg-white border-purple-200 text-gray-800' : 'bg-slate-900 border-slate-600 text-white'}`}>
      <div className={isSpecial ? 'text-purple-400' : 'text-slate-400'}>{formatTime(label, range)}</div>
      <div className="font-semibold">{formatted}</div>
    </div>
  );
};

export default function IndexChart({ indexKey, indexName, currency }) {
  const isSpecial = useTheme();
  const [range, setRange] = useState('1d');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!indexKey) return;
    setLoading(true);
    setError(null);
    axios.get(`/api/chart/${indexKey}?range=${range}`)
      .then(res => { setData(res.data.data); setLoading(false); })
      .catch(() => { setError('차트 데이터를 불러올 수 없습니다.'); setLoading(false); });
  }, [indexKey, range]);

  const isUp = data.length >= 2 ? data[data.length - 1].price >= data[0].price : true;
  const strokeColor = isSpecial
    ? (isUp ? '#059669' : '#dc2626')
    : (isUp ? '#34d399' : '#f87171');

  const prices = data.map(d => d.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const padding = (maxPrice - minPrice) * 0.05 || 1;

  const cardCls = isSpecial
    ? 'bg-white/75 backdrop-blur-sm rounded-xl border-2 border-purple-200 p-6 shadow-md'
    : 'bg-slate-800 rounded-xl border border-slate-700 p-6';
  const titleCls  = isSpecial ? 'text-gray-800'   : 'text-white';
  const tickColor = isSpecial ? '#9333ea'          : '#64748b';
  const gridColor = isSpecial ? '#f3e8ff'          : '#1e293b';
  const axisColor = isSpecial ? '#d8b4fe'          : '#334155';
  const btnActive = isSpecial
    ? 'bg-purple-600 text-white'
    : 'bg-blue-600 text-white';
  const btnInactive = isSpecial
    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    : 'bg-slate-700 text-slate-400 hover:bg-slate-600';

  return (
    <div className={cardCls}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-lg font-semibold ${titleCls}`}>{indexName} 차트</h2>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${range === r.value ? btnActive : btnInactive}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={`flex items-center justify-center h-64 ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>
          <div className="animate-spin text-2xl mr-2">⟳</div> 로딩 중...
        </div>
      )}
      {error && <div className="flex items-center justify-center h-64 text-red-400">{error}</div>}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" tickFormatter={ts => formatTime(ts, range)}
              tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: axisColor }}
              tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={val => currency === 'KRW'
                ? val.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
                : val.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              tick={{ fill: tickColor, fontSize: 11 }} axisLine={{ stroke: axisColor }}
              tickLine={false} width={70} />
            <Tooltip content={<CustomTooltip range={range} currency={currency} isSpecial={isSpecial} />} />
            <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2}
              fill="url(#colorGradient)" dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: isSpecial ? '#fff' : '#0f172a', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
