'use client';

import { useEffect, useState } from 'react';
import { Check, Lock, Zap, DollarSign } from 'lucide-react';
import type { ProviderName } from '@/lib/providers';

interface ProviderStatus {
  hf: boolean;
  luma: boolean;
  runway: boolean;
  fal: boolean;
}

interface ProviderCard {
  id: ProviderName;
  name: string;
  description: string;
  quality: string;
  clipDuration: string;
  tier: 'free' | 'paid';
  requiredKeys: (keyof ProviderStatus)[];
}

const PROVIDERS: ProviderCard[] = [
  {
    id: 'huggingface',
    name: 'Wan 2.1 (HF)',
    description: 'Wan-AI 720P via Wavespeed.ai — top open-source model',
    quality: '720P',
    clipDuration: '5s / clip',
    tier: 'free',
    requiredKeys: ['hf'],
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    description: 'Ray-2 — high quality cinematic output',
    quality: '720P',
    clipDuration: '5s / clip',
    tier: 'paid',
    requiredKeys: ['luma', 'fal'],
  },
  {
    id: 'runway',
    name: 'Runway Gen4',
    description: 'gen4_turbo — best cost/quality balance',
    quality: '720P',
    clipDuration: '10s / clip',
    tier: 'paid',
    requiredKeys: ['runway'],
  },
  {
    id: 'kling',
    name: 'Kling v2.6',
    description: 'Kling Pro via fal.ai — comparable to top commercial models',
    quality: '720P',
    clipDuration: '5s / clip',
    tier: 'paid',
    requiredKeys: ['fal'],
  },
];

interface ProviderSelectorProps {
  selected: ProviderName;
  onChange: (provider: ProviderName) => void;
}

export default function ProviderSelector({ selected, onChange }: ProviderSelectorProps) {
  const [status, setStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    fetch('/api/provider-status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  function isEnabled(card: ProviderCard): boolean {
    if (!status) return false;
    return card.requiredKeys.every(k => status[k]);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: '#9cdcfe' }}>AI Provider</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROVIDERS.map((card) => {
          const enabled = isEnabled(card);
          const isSelected = selected === card.id;

          return (
            <button
              key={card.id}
              disabled={!enabled}
              onClick={() => enabled && onChange(card.id)}
              className="relative flex flex-col gap-2 p-4 rounded border-2 text-left transition-all duration-200"
              style={{
                borderColor: isSelected ? '#007fd4' : '#474747',
                background: isSelected ? 'rgba(0,127,212,0.1)' : '#2d2d2d',
                opacity: !enabled ? 0.4 : 1,
                cursor: !enabled ? 'not-allowed' : 'pointer',
                outline: isSelected ? '1px solid #007fd4' : 'none',
                outlineOffset: '-2px',
              }}
            >
              {/* Tier badge */}
              <span
                className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                style={card.tier === 'free'
                  ? { background: 'rgba(35,209,139,0.15)', color: '#23d18b' }
                  : { background: 'rgba(204,167,0,0.15)', color: '#cca700' }
                }
              >
                {card.tier === 'free' ? <Zap className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                {card.tier === 'free' ? 'Free' : 'Paid'}
              </span>

              {/* Lock badge */}
              {!enabled && (
                <span className="absolute top-3 left-3 rounded-full p-1" style={{ background: '#3c3c3c' }}>
                  <Lock className="w-3 h-3" style={{ color: '#858585' }} />
                </span>
              )}

              {/* Selected check */}
              {isSelected && (
                <span className="absolute top-3 left-3 rounded-full p-0.5" style={{ background: '#007acc' }}>
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}

              <div className={`mt-1 ${enabled && !isSelected ? '' : ''}`}>
                <p className="font-semibold text-sm" style={{ color: '#d4d4d4' }}>{card.name}</p>
                <p className="text-xs mt-0.5 pr-12" style={{ color: '#858585' }}>{card.description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs" style={{ color: '#6c6c6c' }}>
                <span className="px-2 py-0.5 rounded" style={{ background: '#3c3c3c' }}>{card.quality}</span>
                <span className="px-2 py-0.5 rounded" style={{ background: '#3c3c3c' }}>{card.clipDuration}</span>
              </div>

              {!enabled && status && (
                <p className="text-xs" style={{ color: '#f44747' }}>
                  Missing: {card.requiredKeys.filter(k => !status[k]).join(', ')} key
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
