'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CharacterData, StatItem, PowerItem, DisciplineItem, RitualGroup } from '@/lib/redis';

function Dots({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex gap-1 flex-wrap mt-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`w-4 h-4 rounded-full border border-red-900 flex-shrink-0 inline-block ${i < score ? 'bg-red-600' : ''}`}
          style={i < score ? { boxShadow: '0 0 5px rgba(204,34,34,0.5)' } : {}}
        />
      ))}
    </div>
  );
}

function PowerRow({ power, id, selectedId, onSelect }: {
  power: PowerItem;
  id: string;
  selectedId: string | null;
  onSelect: (id: string, power: PowerItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedId === id;

  return (
    <div
      onClick={() => { setExpanded(e => !e); onSelect(id, power); }}
      className={`rounded border cursor-pointer mb-1 transition-colors ${isSelected ? 'bg-[#1e0a0a] border-red-900' : 'border-transparent hover:bg-[#160c0c]'}`}
    >
      <div className="flex justify-between items-center px-2 py-1.5 gap-2">
        <span className="text-sm">
          {power.name}
          {power.level && <span className="text-[#5c4e42] text-xs"> (Lv. {power.level})</span>}
        </span>
        <span className="text-xs text-[#5c4e42] whitespace-nowrap">
          {power.pool.value !== null ? `Pool ${power.pool.value}` : (power.pool.formula || '—')}
        </span>
      </div>
      {expanded && (
        <div className="px-2 pb-2 text-xs text-[#5c4e42] leading-relaxed">
          <p>{power.description}</p>
          <p className="italic mt-1">{[power.activation, power.source].filter(Boolean).join(' · ')}</p>
          <p className="mt-1">{power.pool.label}: {power.pool.formula || '—'}   |   {power.vs.label}: {power.vs.formula || '—'}</p>
        </div>
      )}
    </div>
  );
}

function PowerGroup({ title, score, max, powers, groupKey, selectedId, onSelect }: {
  title: string;
  score?: number;
  max?: number;
  powers: PowerItem[];
  groupKey: string;
  selectedId: string | null;
  onSelect: (id: string, power: PowerItem) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#2a1515]">
        <span className="text-sm font-bold">{title}</span>
        {score !== undefined && max !== undefined && <Dots score={score} max={max} />}
      </div>
      {powers.map((power, i) => (
        <PowerRow key={i} power={power} id={`${groupKey}-${i}`} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface Props {
  username: string;
  initialData: CharacterData;
}

export default function Roller({ username, initialData }: Props) {
  const router = useRouter();
  const [attr, setAttr] = useState('');
  const [skill, setSkill] = useState('');
  const [selectedPowerId, setSelectedPowerId] = useState<string | null>(null);
  const [selectedPower, setSelectedPower] = useState<PowerItem | null>(null);

  const attributes = [...(initialData.attributes ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const skills = [...(initialData.skills ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const disciplines: DisciplineItem[] = initialData.disciplines ?? [];
  const rituals: RitualGroup[] = initialData.rituals ?? [];

  const selectedAttr: StatItem | undefined = attributes.find(a => a.name === attr);
  const selectedSkill: StatItem | undefined = skills.find(s => s.name === skill);
  const total = selectedPower ? (selectedPower.pool.value ?? 0) : (selectedAttr?.score ?? 0) + (selectedSkill?.score ?? 0);

  function selectPower(id: string, power: PowerItem) {
    setAttr('');
    setSkill('');
    setSelectedPowerId(id);
    setSelectedPower(power);
  }

  function handleAttrChange(value: string) {
    setAttr(value);
    setSelectedPowerId(null);
    setSelectedPower(null);
  }

  function handleSkillChange(value: string) {
    setSkill(value);
    setSelectedPowerId(null);
    setSelectedPower(null);
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  const selectClass = 'bg-[#0a0707] border border-[#2a1515] text-[#d4c5a9] px-2 py-2 rounded text-sm font-serif w-full focus:outline-none focus:border-red-900';

  return (
    <main className="min-h-screen bg-[#0d0a0a] text-[#d4c5a9] font-serif flex flex-col">

      <header className="bg-[#130d0d] border-b-2 border-red-900 px-5 py-3 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-lg tracking-[4px] uppercase text-red-600"
          style={{ textShadow: '0 0 18px rgba(180,20,20,0.4)' }}>
          ⚔ Vampire Roller
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] text-[#5c4e42] uppercase tracking-widest">{username}</span>
          <button
            onClick={handleLogout}
            className="text-[0.7rem] text-[#5c4e42] border border-[#2a1515] px-2 py-1 rounded hover:border-red-900 hover:text-[#d4c5a9] transition-colors"
          >
            Esci
          </button>
        </div>
      </header>

      {!attributes.length ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-[#5c4e42] mb-2">Nessuna scheda caricata.</p>
            <p className="text-[#3a2e28] text-sm">Usa l'app locale e clicca "Sincronizza".</p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-[#2a1515] flex-shrink-0">

            <div>
              <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Attributo</label>
              <select value={attr} onChange={e => handleAttrChange(e.target.value)} className={selectClass}>
                <option value="">— Seleziona —</option>
                {attributes.map(a => (
                  <option key={a.name} value={a.name}>{a.name} ({a.score})</option>
                ))}
              </select>
              {selectedAttr && <Dots score={selectedAttr.score} max={selectedAttr.max} />}
            </div>

            <div>
              <label className="block text-[0.6rem] uppercase tracking-[3px] text-red-700 mb-1">Abilità</label>
              <select value={skill} onChange={e => handleSkillChange(e.target.value)} className={selectClass}>
                <option value="">— Seleziona —</option>
                {skills.map(s => (
                  <option key={s.name} value={s.name}>{s.name} ({s.score})</option>
                ))}
              </select>
              {selectedSkill && <Dots score={selectedSkill.score} max={selectedSkill.max} />}
            </div>

          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6 min-h-0">
            <div className="text-[0.6rem] uppercase tracking-[3px] text-[#5c4e42]">Dadi da lanciare</div>
            <div
              className="font-bold text-red-600 leading-none"
              style={{ fontSize: 'clamp(5rem, 25vw, 9rem)', textShadow: '0 0 40px rgba(204,34,34,0.7)' }}
            >
              {selectedPower ? (selectedPower.pool.value ?? '—') : ((selectedAttr || selectedSkill) ? total : '—')}
            </div>
            {selectedPower ? (
              <div className="text-[#5c4e42] text-sm text-center px-4">
                {selectedPower.name} — Vs: {selectedPower.vs.formula || '—'}
              </div>
            ) : selectedAttr && selectedSkill && (
              <div className="text-[#5c4e42] text-sm text-center px-4">
                {selectedAttr.name} {selectedAttr.score} + {selectedSkill.name} {selectedSkill.score}
              </div>
            )}
          </div>

          {(disciplines.length > 0 || rituals.length > 0) && (
            <div className="border-t border-[#2a1515] px-4 py-3 max-h-64 overflow-y-auto flex-shrink-0">
              <div className="text-[0.65rem] uppercase tracking-[3px] text-red-700 mb-2">Discipline &amp; Rituali</div>
              {disciplines.map((disc, i) => (
                <PowerGroup
                  key={`disc-${i}`}
                  title={disc.name}
                  score={disc.score}
                  max={disc.max}
                  powers={disc.powers}
                  groupKey={`disc-${i}`}
                  selectedId={selectedPowerId}
                  onSelect={selectPower}
                />
              ))}
              {rituals.map((rit, i) => (
                <PowerGroup
                  key={`rit-${i}`}
                  title={rit.category}
                  powers={rit.powers}
                  groupKey={`rit-${i}`}
                  selectedId={selectedPowerId}
                  onSelect={selectPower}
                />
              ))}
            </div>
          )}

          {initialData.updatedAt && (
            <div className="text-center text-[#2a1515] text-xs pb-3 flex-shrink-0">
              Sincronizzato: {new Date(initialData.updatedAt).toLocaleString('it-IT')}
            </div>
          )}
        </>
      )}
    </main>
  );
}
