import React, { useState, useEffect, useCallback } from 'react';
import { fxApi } from '../api/premiumApi';
import { ArrowLeftRight, Loader2, TrendingUp } from 'lucide-react';

// Popular currency options for the app's typical use case
const CURRENCIES = [
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'THB', flag: '🇹🇭', name: 'Thai Baht' },
];

// Common expense scenarios for quick reference
const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('INR');
  const [to, setTo] = useState('USD');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [allRates, setAllRates] = useState<Record<string, number> | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rates = await fxApi.getRates(from);
      setAllRates(rates);
      const toRate = rates[to];
      if (!toRate) throw new Error(`Rate not found for ${to}`);
      const numAmt = parseFloat(amount) || 0;
      setResult(+(numAmt * toRate).toFixed(4));
      setRate(toRate);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  }, [from, to, amount]);

  useEffect(() => {
    fetchRates();
  }, [from, to]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (allRates && to) {
      const toRate = allRates[to];
      if (toRate) {
        const numAmt = parseFloat(val) || 0;
        setResult(+(numAmt * toRate).toFixed(4));
      }
    }
  };

  const fromCur = CURRENCIES.find(c => c.code === from);
  const toCur = CURRENCIES.find(c => c.code === to);

  return (
    <div className="space-y-8 pb-10 max-w-3xl">
      {/* Header */}
      <div className="border-b border-border-soft pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Currency Converter</h1>
        <p className="text-secondary mt-1">Live exchange rates to split international expenses fairly.</p>
      </div>

      {/* Main Converter Card */}
      <div className="glass border border-border-soft rounded-2xl p-6 space-y-6">
        {/* Amount Input */}
        <div>
          <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-2 block">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm font-medium">
              {fromCur?.flag} {fromCur?.code}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-24 pr-4 py-4 text-white text-2xl font-bold focus:outline-none focus:border-primary/50 transition-all"
              id="currency-amount-input"
            />
          </div>
        </div>

        {/* From / Swap / To */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-2 block">From</label>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition"
            title="Swap currencies"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <label className="text-xs text-secondary font-medium uppercase tracking-wider mb-2 block">To</label>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-all [color-scheme:dark]"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          ) : error ? (
            <p className="text-danger text-sm">{error}</p>
          ) : result !== null ? (
            <>
              <p className="text-secondary text-sm">
                {parseFloat(amount) || 0} {from} =
              </p>
              <p className="text-4xl font-black text-white mt-1">
                {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                <span className="text-primary ml-2">{to}</span>
              </p>
              {rate !== null && (
                <p className="text-muted text-xs mt-2">
                  1 {from} = {rate.toFixed(6)} {to}
                </p>
              )}
            </>
          ) : null}
        </div>

        {lastUpdated && (
          <p className="text-center text-muted text-xs">
            Rates updated {lastUpdated.toLocaleTimeString()} · Powered by open.er-api.com
          </p>
        )}
      </div>

      {/* Quick Amount Reference */}
      {rate !== null && !error && (
        <div className="glass border border-border-soft rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-white font-semibold">Quick Reference</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => handleAmountChange(String(amt))}
                className="glass border border-white/5 rounded-xl p-3 text-center hover:border-primary/30 hover:bg-primary/5 transition group"
              >
                <p className="text-secondary text-xs group-hover:text-primary transition">
                  {from} {amt.toLocaleString()}
                </p>
                <p className="text-white font-bold text-sm mt-1">
                  {(amt * rate).toFixed(2)}
                </p>
                <p className="text-muted text-[10px]">{to}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All rates table */}
      {allRates && (
        <div className="glass border border-border-soft rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">All Rates vs {from}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CURRENCIES.filter(c => c.code !== from).map(c => {
              const r = allRates[c.code];
              return r ? (
                <div key={c.code} className="bg-white/3 border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-secondary text-sm">{c.flag} {c.code}</span>
                  <span className="text-white font-bold text-sm">{r.toFixed(4)}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
