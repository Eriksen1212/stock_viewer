import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../ThemeContext';

const REFRESH_INTERVAL = 60000;

const fmtRate = (val, base) => {
  if (val == null) return '-';
  if (base === 'JPY') return val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (base === 'DXY') return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtChange = (val, base) => {
  if (val == null) return '-';
  const sign = val >= 0 ? '+' : '';
  return base === 'DXY' ? `${sign}${val.toFixed(3)}` : `${sign}${val.toFixed(2)}`;
};

function ForexCard({ item }) {
  const isSpecial = useTheme();
  const up = item.change >= 0;

  const cardCls = isSpecial
    ? 'bg-white/75 backdrop-blur-sm rounded-xl border-2 border-purple-100 p-4 hover:border-purple-300 transition-colors shadow'
    : 'bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-500 transition-colors';
  const upColor  = isSpecial ? (up ? 'text-emerald-600' : 'text-red-500') : (up ? 'text-emerald-400' : 'text-red-400');
  const badgeBg  = up
    ? (isSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/40 text-emerald-400')
    : (isSpecial ? 'bg-red-100 text-red-600'         : 'bg-red-900/40 text-red-400');
  const nameCls  = isSpecial ? 'text-xs text-gray-500 mb-1' : 'text-xs text-slate-400 mb-1';
  const statCls  = isSpecial ? 'text-xs text-gray-400'      : 'text-xs text-slate-500';
  const woCls    = isSpecial ? 'text-xs font-normal text-gray-400 ml-1' : 'text-xs font-normal text-slate-400 ml-1';

  if (item.error) {
    return (
      <div className={cardCls}>
        <div className={`text-xs ${isSpecial ? 'text-gray-400' : 'text-slate-400'}`}>{item.flag} {item.name}</div>
        <div className={`text-xs mt-2 ${isSpecial ? 'text-gray-300' : 'text-slate-500'}`}>로드 실패</div>
      </div>
    );
  }

  return (
    <div className={cardCls}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-lg mr-1">{item.flag}</span>
          <span className={`text-xs font-semibold ${isSpecial ? 'text-gray-700' : 'text-slate-300'}`}>{item.base}</span>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badgeBg}`}>
          {up ? '▲' : '▼'} {Math.abs(item.changePct).toFixed(2)}%
        </span>
      </div>
      <div className={nameCls}>{item.name}</div>
      <div className={`text-lg font-bold ${upColor}`}>
        {fmtRate(item.rate, item.base)}
        {item.type !== 'dxy' && <span className={woCls}>원</span>}
      </div>
      <div className={`text-xs mt-0.5 ${upColor}`}>{fmtChange(item.change, item.base)}</div>
      <div className={`flex gap-2 mt-2 ${statCls}`}>
        <span>고 {fmtRate(item.dayHigh, item.base)}</span>
        <span>저 {fmtRate(item.dayLow, item.base)}</span>
      </div>
    </div>
  );
}

export default function ForexSection() {
  const isSpecial = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const { data: res } = await axios.get('/api/forex');
      setData(res);
      setLastUpdated(new Date());
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetch]);

  const forex = data.filter(d => d.type === 'forex');
  const dxy   = data.find(d => d.type === 'dxy');

  const sectionTitle = isSpecial ? 'text-gray-800'   : 'text-white';
  const subText      = isSpecial ? 'text-purple-500'  : 'text-slate-400';
  const timeText     = isSpecial ? 'text-purple-400'  : 'text-slate-500';
  const dxyCls       = isSpecial
    ? 'bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow'
    : 'bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3';
  const dxyIconCls   = isSpecial ? 'bg-purple-100 rounded-lg p-2 text-xl' : 'bg-slate-700 rounded-lg p-2 text-xl';
  const dxyNameCls   = isSpecial ? 'text-sm font-semibold text-gray-800'  : 'text-sm font-semibold text-white';
  const dxyDescCls   = isSpecial ? 'text-xs text-purple-400'              : 'text-xs text-slate-400';
  const dxyStatCls   = isSpecial ? 'text-xs text-gray-400 pb-1'           : 'text-xs text-slate-500 pb-1';

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-base font-semibold ${sectionTitle}`}>환율</h2>
          <span className={`text-xs ${subText}`}>원화(KRW) 기준</span>
        </div>
        {lastUpdated && <span className={`text-xs ${timeText}`}>업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className={`rounded-xl border p-4 animate-pulse ${isSpecial ? 'bg-white/60 border-purple-100' : 'bg-slate-800 border-slate-700'}`}>
              <div className={`h-3 rounded w-1/2 mb-2 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
              <div className={`h-3 rounded w-3/4 mb-3 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
              <div className={`h-5 rounded w-full mb-1 ${isSpecial ? 'bg-purple-100' : 'bg-slate-700'}`} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
            {forex.map(item => <ForexCard key={item.symbol} item={item} />)}
          </div>

          {dxy && !dxy.error && (
            <div className={dxyCls}>
              <div className="flex items-center gap-3">
                <div className={dxyIconCls}>{dxy.flag}</div>
                <div>
                  <div className={dxyNameCls}>{dxy.name} (DXY)</div>
                  <div className={dxyDescCls}>주요 6개 통화 대비 달러 강도 지수</div>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <div className={`text-2xl font-bold ${dxy.change >= 0 ? (isSpecial ? 'text-emerald-600' : 'text-emerald-400') : (isSpecial ? 'text-red-500' : 'text-red-400')}`}>
                    {fmtRate(dxy.rate, 'DXY')}
                  </div>
                  <div className={`text-sm ${dxy.change >= 0 ? (isSpecial ? 'text-emerald-600' : 'text-emerald-400') : (isSpecial ? 'text-red-500' : 'text-red-400')}`}>
                    {fmtChange(dxy.change, 'DXY')} ({dxy.change >= 0 ? '+' : ''}{dxy.changePct.toFixed(2)}%)
                  </div>
                </div>
                <div className={dxyStatCls}>
                  <div>고 {fmtRate(dxy.dayHigh, 'DXY')}</div>
                  <div>저 {fmtRate(dxy.dayLow, 'DXY')}</div>
                </div>
                <div className={dxyStatCls}>
                  <div>전일 {fmtRate(dxy.prevClose, 'DXY')}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
