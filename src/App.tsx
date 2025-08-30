
import React, { useEffect, useMemo, useState } from 'react';
import { fetchCoordsByQuery, fetchWeatherByCoords, Unit, wmoToEmoji, wmoToText } from './lib/weatherService';
import { loadLocations, loadTheme, loadUnits, saveLocations, saveTheme, saveUnits, Units as UnitsT, Theme } from './lib/storage';

type Tab = 'hourly' | 'daily';

export default function App() {
  const [units, setUnits] = useState<UnitsT>(loadUnits());
  const [theme, setTheme] = useState<Theme>(loadTheme());
  const [tab, setTab] = useState<Tab>('daily');
  const [query, setQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState<string>('My Location');
  const [saved, setSaved] = useState<string[]>(loadLocations());

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // theme class on root
  useEffect(() => {
    saveTheme(theme);
    const body = document.body;
    if (theme === 'dark') {
      body.classList.remove('bg-gray-100','text-gray-900');
      body.classList.add('bg-gradient-to-br','from-slate-900','to-slate-800','text-white');
    } else {
      body.classList.remove('from-slate-900','to-slate-800','text-white');
      body.classList.add('bg-gray-100','text-gray-900');
    }
  }, [theme]);

  useEffect(() => { saveUnits(units); }, [units]);

  // Initial geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        setLoading(true);
        const fx = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, units as Unit);
        setData(fx);
        setLocationLabel('My Location');
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.warn('Geolocation blocked:', err.message);
    }, { enableHighAccuracy: true });
  }, [units]);

  async function handleSearch() {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const geo = await fetchCoordsByQuery(query.trim());
      if (!geo) { setError('No matching place'); return; }
      const fx = await fetchWeatherByCoords(geo.lat, geo.lon, units as Unit);
      setData(fx);
      setLocationLabel(geo.label.split(',')[0] || 'Result');
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally { setLoading(false); }
  }

  function addSavedCurrent() {
    if (!locationLabel) return;
    const next = Array.from(new Set([locationLabel, ...saved]));
    setSaved(next);
    saveLocations(next);
  }
  function removeSaved(label: string) {
    const next = saved.filter(s => s !== label);
    setSaved(next);
    saveLocations(next);
  }

  const unitLabel = units === 'metric' ? '°C → °F' : '°F → °C';
  const speedUnit = units === 'metric' ? 'km/h' : 'mph';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Top bar */}
      <div className="glass rounded-2xl shadow-soft px-6 py-4 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">React Weather</h1>
          <p className="opacity-80 text-sm">Current, hourly and daily forecasts. Save locations.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search city e.g. London"
            className="px-3 py-2 rounded-lg bg-white/70 text-gray-900 placeholder-gray-600 focus:outline-none"
          />
          <button onClick={handleSearch} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">Search</button>
          <button onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')} className="px-3 py-2 rounded-lg bg-black/30 hover:bg-black/40">
            {unitLabel}
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3 py-2 rounded-lg bg-black/30 hover:bg-black/40">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6 gap-3">
        <button onClick={() => setTab('hourly')} className={`px-5 py-2 rounded-full ${tab==='hourly' ? 'bg-white/20' : 'bg-black/20 hover:bg-black/30'}`}>Hourly</button>
        <button onClick={() => setTab('daily')} className={`px-5 py-2 rounded-full ${tab==='daily' ? 'bg-blue-600 text-white' : 'bg-black/20 hover:bg-black/30'}`}>Daily</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* Main forecast card */}
        <div className="glass rounded-2xl p-6 shadow-soft">
          <div className="mb-4">
            <div className="text-sm opacity-80">{locationLabel}</div>
            <div className="text-5xl font-extrabold">{data?.current?.temperature ?? '—'}{units === 'metric' ? '°C' : '°F'}</div>
            <div className="opacity-90 mt-1">{wmoToText(data?.current?.weatherCode)}</div>
            <div className="opacity-90 mt-1 text-sm">Humidity {data?.current?.humidity ?? '—'}% · Wind {data?.current?.wind ?? '—'} {speedUnit}</div>
          </div>

          <div className="text-sm opacity-80 mb-2">Next {tab === 'daily' ? 'days' : 'hours'}</div>
          <div className="flex gap-3 overflow-x-auto scroll-hide pb-1">
            {tab === 'daily'
              ? (data?.daily ?? []).slice(0, 7).map((d: any, i: number) => (
                <div key={i} className="bg-black/20 rounded-xl px-4 py-3 min-w-[110px] text-center">
                  <div className="font-semibold">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div className="text-2xl my-1">{wmoToEmoji(d.code)}</div>
                  <div className="text-sm">{Math.round(d.max)}{units==='metric'?'°C':'°F'} / {Math.round(d.min)}{units==='metric'?'°C':'°F'}</div>
                </div>
              ))
              : (data?.hourly ?? []).slice(0, 12).map((h: any, i: number) => (
                <div key={i} className="bg-black/20 rounded-xl px-4 py-3 min-w-[90px] text-center">
                  <div className="font-semibold">{h.time.slice(11,16)}</div>
                  <div className="text-2xl my-1">{wmoToEmoji(h.code)}</div>
                  <div className="text-sm">{Math.round(h.temp)}{units==='metric'?'°C':'°F'}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Saved locations panel */}
        <div className="glass rounded-2xl p-5 shadow-soft">
          <div className="text-sm opacity-80 mb-3">Saved Locations</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={addSavedCurrent} className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30">My Location</button>
            <button onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Unit</button>
          </div>
          <div className="text-xs opacity-70 mb-3">Tip: locations persist offline using localStorage.</div>
          <div className="space-y-2">
            {saved.length === 0 && <div className="opacity-70 text-sm">No saved locations.</div>}
            {saved.map(label => (
              <div key={label} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                <span className="truncate">{label}</span>
                <button onClick={() => removeSaved(label)} className="px-2 py-1 rounded-md hover:bg-white/20">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="mt-4 opacity-80">Loading…</div>}
      {error && <div className="mt-2 text-red-300">{error}</div>}
    </div>
  );
}
