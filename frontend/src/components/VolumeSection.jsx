import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const TABS = [
  { key: 'korea', label: '🇰🇷 한국시장' },
  { key: 'us',    label: '🇺🇸 미국시장' },
  { key: 'etf',   label: '📦 ETF' },
  { key: 'leverage', label: '⚡ 레버리지' },
];

const fmtPrice = (price, currency) => {
  if (price == null) return '-';
  if (currency === 'KRW')
    return price.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '원';
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtVolume = (vol, currency) => {
  if (!vol) return '-';
  if (currency === 'KRW') {
    if (vol >= 100000000) return (vol / 100000000).toFixed(1) + '억주';
    if (vol >= 10000) return Math.round(vol / 10000) + '만주';
    return vol.toLocaleString() + '주';
  }
  if (vol >= 1000000000) return (vol / 1000000000).toFixed(1) + 'B';
  if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
  if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
  return vol.toLocaleString();
};

export default function VolumeSection() {
  const isSpecial = useTheme();
  const [activeTab, setActiveTab] = useState('korea');
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchedTabs = useRef(new Set());

  const fetchData = useCallback(async (category) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/volume?category=${category}`);
      if (Array.isArray(data)) {
        setCache(prev => ({ ...prev, [category]: data }));
        fetchedTabs.current.add(category);
        setLastUpdated(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!fetchedTabs.current.has(activeTab)) {
      fetchData(activeTab);
    }
  }, [activeTab, fetchData]);

  const handleRefresh = () => {
    fetchedTabs.current.delete(activeTab);
    fetchData(activeTab);
  };

  const items = cache[activeTab] || [];

  const sectionTitle = isSpecial ? 'text-gray-800'  : 'text-white';
  const timeText     = isSpecial ? 'text-purple-400' : 'text-slate-500';
  const refreshCls   = isSpecial
    ? 'text-sm px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors'
    : 'text-sm px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors';
  const tabActive   = isSpecial ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white';
  const tabInactive = isSpecial
    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    : 'bg-slate-700 text-slate-400 hover:bg-slate-600';
  const tableBg  = isSpecial
    ? 'bg-white/75 backdrop-blur-sm rounded-xl border-2 border-purple-200 shadow-md'
    : 'bg-slate-800 rounded-xl border border-slate-700';
  const headerCls = isSpecial
    ? 'text-xs font-semibold text-purple-500 uppercase tracking-wide py-3 px-4'
    : 'text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4';
  const dividerCls = isSpecial ? 'border-b border-purple-100' : 'border-b border-slate-700';
  const rowCls     = isSpecial
    ? 'border-t border-purple-50 hover:bg-purple-50/60 transition-colors'
    : 'border-t border-slate-700/60 hover:bg-slate-700/40 transition-colors';
  const rankCls  = isSpecial ? 'text-gray-400 font-mono' : 'text-slate-500 font-mono';
  const nameCls  = isSpecial ? 'text-gray-800 font-semibold' : 'text-white font-semibold';
  const symCls   = isSpecial ? 'text-xs text-gray-400' : 'text-xs text-slate-500';
  const priceCls = isSpecial ? 'text-gray-800 font-mono' : 'text-white font-mono';
  const volCls   = isSpecial ? 'text-gray-500' : 'text-slate-400';

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-base font-semibold ${sectionTitle}`}>거래량 상위 종목</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className={`text-xs ${timeText}`}>
              업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
            </span>
          )}
          <button onClick={handleRefresh} className={refreshCls}>새로고침</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? tabActive : tabInactive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={tableBg}>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <div className={`animate-spin text-xl ${isSpecial ? 'text-purple-400' : 'text-slate-400'}`}>⟳</div>
            <span className={isSpecial ? 'text-purple-400' : 'text-slate-400'}>불러오는 중...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={dividerCls}>
                <th className={`${headerCls} text-left w-10`}>#</th>
                <th className={`${headerCls} text-left`}>종목</th>
                <th className={`${headerCls} text-right`}>현재가</th>
                <th className={`${headerCls} text-right`}>등락률</th>
                <th className={`${headerCls} text-right hidden sm:table-cell`}>전일대비</th>
                <th className={`${headerCls} text-right`}>거래량</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                if (item.error) {
                  return (
                    <tr key={item.symbol} className={rowCls}>
                      <td className={`py-2.5 px-2 sm:px-4 ${rankCls}`}>{idx + 1}</td>
                      <td className="py-2.5 px-2 sm:px-4">
                        <div className={nameCls}>{item.name}</div>
                        <div className={symCls}>{item.symbol}</div>
                      </td>
                      <td colSpan={4} className={`py-2.5 px-2 sm:px-4 text-center ${isSpecial ? 'text-gray-400' : 'text-slate-500'}`}>
                        데이터 없음
                      </td>
                    </tr>
                  );
                }

                const isUp = item.changePct >= 0;
                const changeColor = isUp
                  ? (isSpecial ? 'text-emerald-600' : 'text-emerald-400')
                  : (isSpecial ? 'text-red-500'     : 'text-red-400');
                const badgeBg = isUp
                  ? (isSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-emerald-400')
                  : (isSpecial ? 'bg-red-100 text-red-600'         : 'bg-red-900/30 text-red-400');

                return (
                  <tr key={item.symbol} className={rowCls}>
                    <td className={`py-2.5 px-2 sm:px-4 ${rankCls} text-base`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="py-2.5 px-2 sm:px-4">
                      <div className={`${nameCls} text-xs sm:text-sm`}>{item.name}</div>
                      <div className={symCls}>{item.symbol}</div>
                    </td>
                    <td className={`py-2.5 px-2 sm:px-4 text-right text-xs sm:text-sm ${priceCls}`}>
                      {fmtPrice(item.price, item.currency)}
                    </td>
                    <td className="py-2.5 px-2 sm:px-4 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${badgeBg}`}>
                        {isUp ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
                      </span>
                    </td>
                    <td className={`py-2.5 px-2 sm:px-4 text-right text-xs hidden sm:table-cell ${changeColor}`}>
                      {isUp ? '+' : ''}{item.currency === 'KRW'
                        ? item.change?.toLocaleString('ko-KR', { maximumFractionDigits: 0 })
                        : item.change?.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-2 sm:px-4 text-right text-xs sm:text-sm ${volCls}`}>
                      {fmtVolume(item.volume, item.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
