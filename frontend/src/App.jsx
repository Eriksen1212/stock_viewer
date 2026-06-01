import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ThemeContext } from './ThemeContext';
import IndexCard from './components/IndexCard';
import IndexChart from './components/IndexChart';
import SearchBar from './components/SearchBar';
import StockDetail from './components/StockDetail';
import ForexSection from './components/ForexSection';
import PokemonBackground from './components/PokemonBackground';

const REFRESH_INTERVAL = 30000;

function PokeballToggle({ onClick }) {
  return (
    <button className="pokeball-btn" onClick={onClick} title="Special Mode로 전환">
      <div className="pokeball-top" />
      <div className="pokeball-bottom" />
      <div className="pokeball-line" />
      <div className="pokeball-center" />
    </button>
  );
}

export default function App() {
  const [indices, setIndices] = useState([]);
  const [selectedKey, setSelectedKey] = useState('nasdaq100');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [searchedStock, setSearchedStock] = useState(null);
  const [isSpecial, setIsSpecial] = useState(false);

  const fetchIndices = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/indices');
      setIndices(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const timer = setInterval(fetchIndices, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchIndices]);

  const selectedIndex = indices.find(i => i.key === selectedKey);

  const handleIndexClick = key => {
    setSelectedKey(key);
    setSearchedStock(null);
  };

  const marketStatus = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const koHour = (hour + 9) % 24;
    const usHour = (hour - 4 + 24) % 24;
    const statuses = [];
    if (koHour >= 9 && koHour < 15.5) statuses.push('🇰🇷 한국 개장');
    else statuses.push('🇰🇷 한국 마감');
    if (usHour >= 9.5 && usHour < 16) statuses.push('🇺🇸 미국 개장');
    else statuses.push('🇺🇸 미국 마감');
    return statuses.join(' · ');
  };

  // 테마별 스타일
  const rootBg = isSpecial
    ? 'min-h-screen p-4 md:p-8 relative'
    : 'min-h-screen bg-slate-900 p-4 md:p-8';
  const titleCls = isSpecial ? 'text-2xl md:text-3xl font-bold tracking-tight special-title' : 'text-2xl md:text-3xl font-bold text-white tracking-tight';
  const statusCls = isSpecial ? 'text-purple-600 text-sm mt-1' : 'text-slate-400 text-sm mt-1';
  const timeCls   = isSpecial ? 'text-xs text-purple-400 whitespace-nowrap' : 'text-xs text-slate-500 whitespace-nowrap';
  const refreshCls= isSpecial
    ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap font-medium'
    : 'bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap';
  const footerCls = isSpecial ? 'mt-8 text-center text-xs text-purple-300' : 'mt-8 text-center text-xs text-slate-600';
  const statCardCls = isSpecial
    ? 'bg-white/75 backdrop-blur-sm rounded-xl border-2 border-purple-200 p-4 shadow'
    : 'bg-slate-800 rounded-xl border border-slate-700 p-4';
  const statLabelCls = isSpecial ? 'text-xs text-purple-500 mb-1' : 'text-xs text-slate-400 mb-1';
  const statValCls   = isSpecial ? 'text-base font-semibold text-gray-800' : 'text-base font-semibold text-white';

  return (
    <ThemeContext.Provider value={isSpecial}>
      {/* Special 모드 배경 */}
      {isSpecial && (
        <>
          <div className="fixed inset-0 z-0" style={{
            background: 'linear-gradient(135deg, #bfdbfe 0%, #ddd6fe 35%, #fbcfe8 70%, #fde68a 100%)',
          }} />
          <PokemonBackground />
        </>
      )}

      <div className={rootBg}>
        {/* 컨텐츠는 포켓몬 배경 위에 */}
        <div className="relative z-10">

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className={titleCls}>
                  {isSpecial ? '✨ ' : '📊 '}Global Market Dashboard
                </h1>
                <p className={statusCls}>{marketStatus()}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SearchBar onSelect={setSearchedStock} />
                {lastUpdated && <span className={timeCls}>업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>}
                <button onClick={fetchIndices} className={refreshCls}>새로고침</button>
                {/* 모드 토글 */}
                {isSpecial ? (
                  <button
                    onClick={() => setIsSpecial(false)}
                    title="일반 모드로 전환"
                    className="text-xs bg-slate-800/60 backdrop-blur-sm text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-700/80 transition-colors whitespace-nowrap"
                  >
                    🌑 일반 모드
                  </button>
                ) : (
                  <PokeballToggle onClick={() => setIsSpecial(true)} />
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-4 mb-6 text-sm">{error}</div>
          )}

          {/* Index Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`rounded-xl border p-4 animate-pulse ${isSpecial ? 'bg-white/60 border-purple-100' : 'bg-slate-800 border-slate-700'}`}>
                  <div className={`h-3 rounded w-1/2 mb-2 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
                  <div className={`h-5 rounded w-3/4 mb-3 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
                  <div className={`h-7 rounded w-full mb-2 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
                  <div className={`h-3 rounded w-1/3 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {indices.map(index => (
                <IndexCard
                  key={index.key}
                  index={index}
                  selected={!searchedStock && selectedKey === index.key}
                  onClick={() => handleIndexClick(index.key)}
                />
              ))}
            </div>
          )}

          {/* 검색된 종목 상세 */}
          {searchedStock && (
            <StockDetail
              symbol={searchedStock.symbol}
              name={searchedStock.name}
              onClose={() => setSearchedStock(null)}
            />
          )}

          {/* 지수 차트 */}
          {!searchedStock && selectedIndex && !selectedIndex.error && (
            <>
              <IndexChart
                indexKey={selectedKey}
                indexName={selectedIndex.name}
                currency={selectedIndex.currency}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { label: '현재가',   value: selectedIndex.price,    currency: selectedIndex.currency },
                  { label: '전일 종가', value: selectedIndex.prevClose, currency: selectedIndex.currency },
                  { label: '당일 최고', value: selectedIndex.dayHigh,   currency: selectedIndex.currency },
                  { label: '당일 최저', value: selectedIndex.dayLow,    currency: selectedIndex.currency },
                ].map(({ label, value, currency }) => (
                  <div key={label} className={statCardCls}>
                    <div className={statLabelCls}>{label}</div>
                    <div className={statValCls}>
                      {value != null
                        ? currency === 'KRW'
                          ? value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
                          : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 환율 섹션 */}
          <ForexSection />

          <div className={footerCls}>
            데이터 출처: Yahoo Finance · 30초마다 자동 새로고침
            {isSpecial && ' · ✨ Special Mode'}
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
