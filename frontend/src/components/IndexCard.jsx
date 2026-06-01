import React from 'react';
import { useTheme } from '../ThemeContext';

const fmt = (val, currency) => {
  if (val == null) return '-';
  if (currency === 'KRW') return val.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function IndexCard({ index, selected, onClick }) {
  const isSpecial = useTheme();
  if (!index) return null;

  const up = index.change >= 0;
  const upColor  = isSpecial ? (up ? 'text-emerald-600' : 'text-red-500') : (up ? 'text-emerald-400' : 'text-red-400');
  const badgeBg  = up
    ? (isSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/50 text-emerald-400')
    : (isSpecial ? 'bg-red-100 text-red-600'         : 'bg-red-900/50 text-red-400');

  const cardBase = isSpecial
    ? 'bg-white/75 backdrop-blur-sm rounded-xl border-2 p-4 cursor-pointer transition-all shadow-md'
    : 'bg-slate-800 rounded-xl border p-4 cursor-pointer transition-all';

  const cardBorder = isSpecial
    ? (selected ? 'border-yellow-400 shadow-yellow-300/50 shadow-lg ring-2 ring-yellow-300' : 'border-purple-200 hover:border-purple-400')
    : (selected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700 hover:border-slate-500');

  const nameColor   = isSpecial ? 'text-gray-800'    : 'text-slate-200';
  const symbolColor = isSpecial ? 'text-purple-500'  : 'text-slate-400';
  const statColor   = isSpecial ? 'text-gray-400'    : 'text-slate-500';

  if (index.error) {
    return (
      <div className={`${cardBase} ${isSpecial ? 'border-gray-200' : 'border-slate-700'}`} onClick={onClick}>
        <div className={`text-sm ${symbolColor}`}>{index.name}</div>
        <div className={`text-sm mt-2 ${statColor}`}>데이터 로드 실패</div>
      </div>
    );
  }

  return (
    <div className={`${cardBase} ${cardBorder}`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <div>
          <div className={`text-xs mb-0.5 ${symbolColor}`}>{index.symbol}</div>
          <div className={`text-sm font-semibold ${nameColor}`}>{index.name}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>
          {up ? '▲' : '▼'} {Math.abs(index.changePct).toFixed(2)}%
        </span>
      </div>
      <div className={`text-2xl font-bold mt-2 ${upColor}`}>{fmt(index.price, index.currency)}</div>
      <div className={`text-sm mt-0.5 ${upColor}`}>{up ? '+' : ''}{fmt(index.change, index.currency)}</div>
      <div className={`flex gap-4 mt-2 text-xs ${statColor}`}>
        <span>고 {fmt(index.dayHigh, index.currency)}</span>
        <span>저 {fmt(index.dayLow, index.currency)}</span>
      </div>
    </div>
  );
}
