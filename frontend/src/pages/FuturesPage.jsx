import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ThemeContext } from '../ThemeContext';
import StockDetail from '../components/StockDetail';

const SECTIONS = [
  {
    key: 'indices',
    label: '주가지수 선물',
    icon: '📊',
    items: [
      { symbol: 'ES=F',  name: 'S&P 500 E-mini' },
      { symbol: 'NQ=F',  name: 'NASDAQ 100 E-mini' },
      { symbol: 'YM=F',  name: '다우존스 E-mini' },
      { symbol: 'RTY=F', name: '러셀 2000 E-mini' },
    ],
  },
  {
    key: 'commodities',
    label: '원자재 선물',
    icon: '🪙',
    items: [
      { symbol: 'GC=F', name: '금 (Gold)' },
      { symbol: 'SI=F', name: '은 (Silver)' },
      { symbol: 'CL=F', name: 'WTI 원유' },
      { symbol: 'NG=F', name: '천연가스' },
      { symbol: 'HG=F', name: '구리 (Copper)' },
      { symbol: 'PL=F', name: '백금 (Platinum)' },
    ],
  },
  {
    key: 'currencies',
    label: '통화 선물',
    icon: '💱',
    items: [
      { symbol: '6E=F', name: '유로 (EUR/USD)' },
      { symbol: '6J=F', name: '엔화 (JPY/USD)' },
      { symbol: '6B=F', name: '파운드 (GBP/USD)' },
      { symbol: '6A=F', name: '호주달러 (AUD/USD)' },
    ],
  },
  {
    key: 'bonds',
    label: '채권 선물',
    icon: '📜',
    items: [
      { symbol: 'ZN=F', name: '미 10년 국채' },
      { symbol: 'ZB=F', name: '미 30년 국채' },
    ],
  },
  {
    key: 'crypto',
    label: '암호화폐 선물',
    icon: '₿',
    items: [
      { symbol: 'BTC=F', name: '비트코인 선물 (CME)' },
    ],
  },
  {
    key: 'korea',
    label: '한국시장',
    icon: '🇰🇷',
    items: [
      { symbol: '005930.KS', name: '삼성전자' },
      { symbol: '000660.KS', name: 'SK하이닉스' },
      { symbol: '^KS11',     name: 'KOSPI 지수' },
      { symbol: '^KQ11',     name: 'KOSDAQ 지수' },
    ],
  },
];

const fmtPrice = (price, currency) => {
  if (price == null) return '-';
  if (currency === 'KRW')
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function FuturesCard({ item, data, loading, selected, onClick }) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 animate-pulse">
        <div className="h-3 rounded bg-slate-700 w-2/3 mb-2" />
        <div className="h-4 rounded bg-slate-700 w-full mb-3" />
        <div className="h-6 rounded bg-slate-700 w-3/4 mb-2" />
        <div className="h-3 rounded bg-slate-700 w-1/2" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="text-xs text-slate-400 mb-1">{item.symbol}</div>
        <div className="text-sm font-semibold text-slate-200">{item.name}</div>
        <div className="text-xs text-slate-500 mt-2">데이터 없음</div>
      </div>
    );
  }

  const isUp = data.changePct >= 0;
  const upColor = isUp ? 'text-emerald-400' : 'text-red-400';
  const badgeBg = isUp ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400';
  const border = selected
    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
    : 'border-slate-700 hover:border-slate-500';

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 rounded-xl border p-4 cursor-pointer transition-all ${border}`}
    >
      <div className="flex justify-between items-start gap-1">
        <div className="min-w-0">
          <div className="text-xs text-slate-400 truncate">{item.symbol}</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 leading-snug">{item.name}</div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeBg}`}>
          {isUp ? '▲' : '▼'}{Math.abs(data.changePct).toFixed(2)}%
        </span>
      </div>
      <div className={`text-xl font-bold mt-2 ${upColor}`}>
        {fmtPrice(data.price, data.currency)}
        <span className="text-xs font-normal text-slate-500 ml-1">{data.currency}</span>
      </div>
      <div className={`text-xs mt-0.5 ${upColor}`}>
        {isUp ? '+' : ''}{data.currency === 'KRW'
          ? data.change?.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
          : data.change?.toFixed(data.currency === 'USD' && data.price < 10 ? 4 : 2)}
      </div>
      <div className="flex gap-3 mt-2 text-xs text-slate-500">
        <span>고 {fmtPrice(data.dayHigh, data.currency)}</span>
        <span>저 {fmtPrice(data.dayLow, data.currency)}</span>
      </div>
    </div>
  );
}

export default function FuturesPage() {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchTimer = useRef(null);
  const detailRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/futures');
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(item => { map[item.symbol] = item; });
        setDataMap(map);
        setLastUpdated(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [fetchAll]);

  const handleSearchChange = e => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/futures-search?q=${encodeURIComponent(q.trim())}`);
        if (Array.isArray(data)) { setSearchResults(data); setSearchOpen(true); }
      } catch {
        setSearchResults([]);
      } finally { setSearchLoading(false); }
    }, 300);
  };

  const handleSelectSearch = item => {
    setSelected({ symbol: item.symbol, name: item.name });
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleCardClick = item => {
    setSelected(prev => prev?.symbol === item.symbol ? null : { symbol: item.symbol, name: item.name });
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <ThemeContext.Provider value={false}>
      <div className="min-h-screen bg-slate-900 p-4 md:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm shrink-0"
            >
              ← 메인으로
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              📈 선물 시세
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500 whitespace-nowrap">
                업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
              </span>
            )}
            <button
              onClick={fetchAll}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors whitespace-nowrap"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative mb-8 max-w-xl">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              placeholder="선물 종목 검색... (예: Gold, Oil, Bitcoin, KOSPI, ES=F)"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin">⟳</span>
            )}
          </div>

          {searchOpen && searchResults.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
              {searchResults.map(item => (
                <li
                  key={item.symbol}
                  onClick={() => handleSelectSearch(item)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-0"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-white text-sm">{item.symbol}</span>
                    <span className="ml-2 text-slate-400 text-xs truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-slate-500">{item.exchange}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.type === 'FUTURE' ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-700 text-slate-300'
                    }`}>{item.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {searchOpen && !searchLoading && searchResults.length === 0 && searchQuery.trim() && (
            <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* Selected detail */}
        {selected && (
          <div ref={detailRef} className="mb-8">
            <StockDetail
              symbol={selected.symbol}
              name={selected.name}
              onClose={() => setSelected(null)}
            />
          </div>
        )}

        {/* Category sections */}
        {SECTIONS.map(section => (
          <div key={section.key} className="mb-10">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {section.items.map(item => (
                <FuturesCard
                  key={item.symbol}
                  item={item}
                  data={dataMap[item.symbol]}
                  loading={loading}
                  selected={selected?.symbol === item.symbol}
                  onClick={() => handleCardClick(item)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 text-center text-xs text-slate-600 pb-4">
          데이터 출처: Yahoo Finance ·{' '}
          <Link to="/" className="hover:text-slate-400 transition-colors">
            메인 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
