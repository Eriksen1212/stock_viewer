import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const TYPE_LABEL = { EQUITY: '주식', ETF: 'ETF', INDEX: '지수', MUTUALFUND: '펀드' };

export default function SearchBar({ onSelect }) {
  const isSpecial = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = e => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/search?q=${encodeURIComponent(val)}`);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = item => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect(item);
  };

  const inputCls = isSpecial
    ? 'w-full bg-white/80 backdrop-blur-sm border-2 border-purple-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-purple-300 focus:outline-none focus:border-purple-500 transition-colors shadow'
    : 'w-full bg-slate-800 border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors';
  const dropdownCls = isSpecial
    ? 'absolute z-50 mt-1 w-full bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden'
    : 'absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden';
  const itemCls = isSpecial
    ? 'flex items-center justify-between px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-b border-purple-100 last:border-0'
    : 'flex items-center justify-between px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-0';
  const symbolCls  = isSpecial ? 'font-semibold text-purple-700 text-sm' : 'font-semibold text-white text-sm';
  const nameCls    = isSpecial ? 'ml-2 text-gray-500 text-xs'            : 'ml-2 text-slate-400 text-xs';
  const exchangeCls= isSpecial ? 'text-xs text-gray-400'                 : 'text-xs text-slate-500';
  const badgeCls   = isSpecial ? 'text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded' : 'text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded';
  const emptyMsg   = isSpecial ? 'text-purple-400' : 'text-slate-400';

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>🔍</span>
        <input type="text" value={query} onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="티커 또는 영문 종목명 검색 (예: AAPL, Samsung, Tesla)"
          className={inputCls} />
        {loading && <span className={`absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-base ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>⟳</span>}
      </div>

      {open && results.length > 0 && (
        <ul className={dropdownCls}>
          {results.map(item => (
            <li key={item.symbol} onClick={() => handleSelect(item)} className={itemCls}>
              <div>
                <span className={symbolCls}>{item.symbol}</span>
                <span className={nameCls}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={exchangeCls}>{item.exchange}</span>
                <span className={badgeCls}>{TYPE_LABEL[item.type] || item.type}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div className={`absolute z-50 mt-1 w-full ${isSpecial ? 'bg-white/95 border-2 border-purple-200' : 'bg-slate-800 border border-slate-600'} rounded-xl px-4 py-3 text-sm ${emptyMsg}`}>
          검색 결과가 없습니다. (한글보다 영문 검색이 더 잘 됩니다)
        </div>
      )}
    </div>
  );
}
