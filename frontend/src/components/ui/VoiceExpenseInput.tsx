/**
 * VoiceExpenseInput — Voice-to-Expense using the Web Speech API.
 *
 * Listens for natural language like:
 *   "Lunch 500 paid by me"
 *   "Netflix 199"
 *   "Uber 350 paid by Shri"
 *
 * Extracts: title, amount, and optionally a "paid by" name hint.
 * Calls onResult with the parsed data so the parent can pre-fill a form.
 *
 * Falls back gracefully in browsers that do not support the API.
 */
import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VoiceResult {
  title: string;
  amount: number | null;
  paidByHint: string | null;  // raw name text; parent resolves to user ID
  rawTranscript: string;
}

interface VoiceExpenseInputProps {
  onResult: (result: VoiceResult) => void;
  className?: string;
}

// Detect Speech Recognition API (vendor-prefixed in some browsers)
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const SUPPORTED = !!SpeechRecognition;

/**
 * Parse a natural-language transcript into expense fields.
 * Regex-based parser is deterministic — no external ML required.
 */
function parseTranscript(text: string): VoiceResult {
  const lower = text.toLowerCase().trim();

  // Extract amount — look for number patterns like 500, 1,500, 2000.50
  const amountMatch = lower.match(/[\d,]+(?:\.\d{1,2})?/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : null;

  // Extract "paid by <name>" pattern
  const paidByMatch = lower.match(/paid by ([a-z\s]+?)(?:\s*$|,|\.|and)/i);
  const paidByHint = paidByMatch ? paidByMatch[1].trim() : null;

  // Title: everything before the first number (cleaned up)
  let title = lower.replace(/[\d,]+(?:\.\d{1,2})?/, '').replace(/paid by .*/i, '').trim();
  // Capitalise first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  // Fall back to transcript if nothing sensible was extracted
  if (!title || title.length < 2) title = text;

  return { title, amount, paidByHint, rawTranscript: text };
}

export function VoiceExpenseInput({ onResult, className }: VoiceExpenseInputProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognizerRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!SUPPORTED) {
      setError('Your browser does not support voice input. Try Chrome or Edge.');
      return;
    }
    setError('');
    setTranscript('');

    const recognizer = new SpeechRecognition();
    recognizer.lang = 'en-IN'; // Indian English for better ₹ context
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;
    recognizerRef.current = recognizer;

    recognizer.onstart = () => setListening(true);
    recognizer.onend = () => setListening(false);
    recognizer.onerror = (e: any) => {
      setError(e.error === 'no-speech' ? 'No speech detected. Try again.' : `Error: ${e.error}`);
      setListening(false);
    };

    recognizer.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      // When the result is final, parse and return
      if (result.isFinal) {
        onResult(parseTranscript(text));
        setListening(false);
      }
    };

    recognizer.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    setListening(false);
  }, []);

  if (!SUPPORTED) {
    return (
      <div className={cn('flex items-center gap-2 text-secondary text-xs', className)}>
        <MicOff className="w-4 h-4" />
        <span>Voice input not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={listening ? stop : start}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
            listening
              ? 'border-danger/40 bg-danger/10 text-danger animate-pulse'
              : 'border-white/10 bg-white/5 text-secondary hover:border-primary/30 hover:text-white'
          )}
          id="voice-input-btn"
        >
          {listening ? (
            <><MicOff className="w-4 h-4" /> Stop</>
          ) : (
            <><Mic className="w-4 h-4" /> Voice Input</>
          )}
        </button>

        {listening && (
          <span className="flex items-center gap-1.5 text-xs text-danger">
            <span className="w-2 h-2 rounded-full bg-danger animate-ping inline-block" />
            Listening…
          </span>
        )}
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <p className="text-white text-sm flex-1 italic">"{transcript}"</p>
          <button onClick={() => setTranscript('')} className="text-secondary hover:text-white transition mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-danger text-xs">{error}</p>
      )}

      {!SUPPORTED && (
        <p className="text-muted text-xs">Try: "Lunch 500 paid by me" or "Netflix 199"</p>
      )}
    </div>
  );
}
