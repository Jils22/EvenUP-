import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Brain, Send, Loader2, TrendingUp, AlertTriangle, CheckCircle, Info, ChevronRight, Zap, TrendingDown } from 'lucide-react';
import { apiClient } from '../api/client';

// ── API ──────────────────────────────────────────────────────────────────────
const fetchInsights = () => apiClient.get('/ai/insights').then(r => r.data);
const sendChat = (message: string) => apiClient.post('/ai/chat', { message }).then(r => r.data);

// ── Types ────────────────────────────────────────────────────────────────────
interface Insight { type: string; icon: string; title: string; body: string; action: string | null; action_route: string | null; }
interface Message { role: 'user' | 'ai'; text: string; }

const TYPE_CONFIG: Record<string, { border: string; bg: string; Icon: typeof Info }> = {
  warning: { border: 'border-warning/30', bg: 'bg-warning/5',   Icon: AlertTriangle },
  success: { border: 'border-success/30', bg: 'bg-success/5',   Icon: CheckCircle },
  info:    { border: 'border-primary/30', bg: 'bg-primary/5',   Icon: TrendingUp },
};

// ── Sub-components ───────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: Insight }) {
  const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.Icon;
  return (
    <div className={`glass border ${cfg.border} ${cfg.bg} rounded-2xl p-5 flex gap-4 transition-all hover:scale-[1.01]`}>
      <span className="text-2xl shrink-0 mt-0.5">{insight.icon || '✨'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5 opacity-60" />
          <h3 className="text-sm font-bold text-white">{insight.title}</h3>
        </div>
        <p className="text-secondary text-sm leading-relaxed">{insight.body}</p>
        {insight.action && insight.action_route && (
          <Link to={insight.action_route} className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary hover:text-white transition-colors">
            {insight.action} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === 'ai';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Brain className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isAI ? 'glass border border-border-soft text-white' : 'bg-primary text-white'
      }`}>
        {msg.text.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hi! 👋 I'm your EvenUP AI Advisor. Ask me about your debts, spending by category, upcoming bills, or financial tips!" }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ['ai-insights'], queryFn: fetchInsights });

  const mutation = useMutation({
    mutationFn: sendChat,
    onSuccess: (res) => setMessages(prev => [...prev, { role: 'ai', text: res.reply }]),
    onError: () => setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that. Please try again." }]),
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || mutation.isPending) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    mutation.mutate(msg);
  };

  const summary = data?.summary;
  const insights: Insight[] = data?.insights ?? [];

  const QUICK = ['Who do I owe?', 'Monthly spending?', 'Top category?', 'Any tips?'];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border-soft pb-6">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-purple-700 flex items-center justify-center shadow-[0_0_30px_rgba(192,143,245,0.4)]">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Advisor</h1>
          <p className="text-secondary text-sm mt-0.5">Your personal financial intelligence</p>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'You Owe', value: `₹${(summary.total_owed / 100).toFixed(0)}`, color: summary.total_owed > 0 ? 'text-danger' : 'text-success' },
            { label: 'Owed to You', value: `₹${(summary.total_owed_to_you / 100).toFixed(0)}`, color: 'text-success' },
            { 
              label: 'Spend Velocity', 
              value: `${summary.velocity > 0 ? '+' : ''}${summary.velocity.toFixed(0)}%`, 
              color: summary.velocity > 15 ? 'text-danger' : summary.velocity < -5 ? 'text-success' : 'text-primary',
              Icon: summary.velocity > 15 ? Zap : summary.velocity < -5 ? TrendingDown : TrendingUp
            },
            { label: 'Top Group', value: summary.top_group, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="glass border border-border-soft rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {s.Icon && <s.Icon className={`w-3 h-3 ${s.color} opacity-70`} />}
                <p className="text-secondary text-xs">{s.label}</p>
              </div>
              <p className={`font-bold text-lg truncate ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insights Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Smart Insights
          </h2>
          {isLoading ? (
            <div className="glass border border-border-soft rounded-2xl p-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          )}
        </div>
        
        {/* Statistics & Forecasts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Spending Health
          </h2>
          {summary?.top_categories?.length > 0 && (
            <div className="glass border border-border-soft rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Top Spending Categories</h3>
              <div className="space-y-3">
                {summary.top_categories.map((cat: any, i: number) => {
                  const max = summary.top_categories[0].amount_minor;
                  const pct = max > 0 ? (cat.amount_minor / max) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary capitalize">{cat.name}</span>
                        <span className="text-white font-medium">₹{(cat.amount_minor / 100).toFixed(0)}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col glass border border-border-soft rounded-2xl h-150">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border-soft">
            <div className="relative">
              <Brain className="w-5 h-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full" />
            </div>
            <span className="text-white font-semibold text-sm">Ask your Advisor</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="glass border border-border-soft rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {QUICK.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="text-xs border border-border-soft rounded-full px-3 py-1 text-secondary hover:text-white hover:border-primary/50 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border-soft flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your finances..."
              className="flex-1 bg-white/5 border border-border-soft rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || mutation.isPending}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/80 disabled:opacity-40 transition shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
