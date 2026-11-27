import React, { useEffect, useRef, useState } from 'react';
import './publicTournamentDirectory.css';

type TournamentState = 'upcoming' | 'registration' | 'active' | 'archive';

export type PublicTournamentEntry = {
  id: string;
  title: string;
  game: string;
  state: TournamentState;
  href: string;
  format?: string;
  poster?: string;
};

const statusLabels: Record<TournamentState, { status: string; action: string }> = {
  upcoming: { status: 'به‌زودی', action: 'مشاهدهٔ برنامه' },
  registration: { status: 'ثبت‌نام باز', action: 'ثبت‌نام' },
  active: { status: 'در حال برگزاری', action: 'مشاهدهٔ مسابقه' },
  archive: { status: 'پایان‌یافته', action: 'مشاهدهٔ آرشیو' },
};

function TournamentCards({ entries }: { entries: readonly PublicTournamentEntry[] }) {
  return <ul className="tournament-directory__cards">
    {entries.map(entry => {
      const { status, action } = statusLabels[entry.state];
      return <li key={entry.id} className="tournament-directory__card" data-state={entry.state}>
        <div className="tournament-directory__card-body">
          <div className="tournament-directory__summary">
            {entry.poster && <img src={entry.poster} alt="" loading="lazy" />}
            <div className="tournament-directory__text">
              <p className="tournament-directory__status">{status}</p>
              <h3>{entry.title}</h3>
              <p className="tournament-directory__meta">{[entry.game, entry.format].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <a className="tournament-directory__action" href={entry.href} aria-label={action + '، ' + entry.title}>{action}</a>
        </div>
      </li>;
    })}
  </ul>;
}

const directoryTabs = [
  { key: 'active', label: 'فعال' },
  { key: 'upcoming', label: 'به‌زودی' },
  { key: 'archive', label: 'آرشیو' },
] as const;

type DirectoryView = typeof directoryTabs[number]['key'];

function viewFromHash(): DirectoryView {
  return directoryTabs.find(tab => window.location.hash === '#temporary-' + tab.key)?.key ?? 'active';
}

export function TournamentDirectoryEntry({ entries, activePending, activeContent }: {
  entries: readonly PublicTournamentEntry[];
  activePending: boolean;
  activeContent?: React.ReactNode;
}) {
  const [view, setView] = useState(viewFromHash);
  const tabList = useRef<HTMLDivElement>(null);
  const active = entries.filter(entry => entry.state === 'registration' || entry.state === 'active');
  const upcoming = entries.filter(entry => entry.state === 'upcoming');
  const archive = entries.filter(entry => entry.state === 'archive');

  useEffect(() => {
    const sync = () => setView(viewFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function selectTab(next: DirectoryView) {
    setView(next);
    window.history.replaceState(window.history.state, '', '#temporary-' + next);
  }

  function handleArrow(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowLeft': nextIndex = (index + 1) % directoryTabs.length; break;
      case 'ArrowRight': nextIndex = (index + directoryTabs.length - 1) % directoryTabs.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = directoryTabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    const next = directoryTabs[nextIndex].key;
    selectTab(next);
    tabList.current?.querySelector<HTMLButtonElement>('#temporary-tab-' + next)?.focus();
  }

  const lists: Record<DirectoryView, readonly PublicTournamentEntry[]> = { active, upcoming, archive };
  const empty: Record<DirectoryView, string> = {
    active: activePending ? 'در حال دریافت وضعیت مسابقات…' : 'فعلاً مسابقهٔ فعالی در این فهرست نمایش داده نمی‌شود.',
    upcoming: 'فعلاً مسابقه‌ای برای این بخش اعلام نشده است.',
    archive: 'فعلاً مسابقه‌ای در آرشیو نمایش داده نمی‌شود.',
  };

  return <section className="tournament-directory" aria-labelledby="temporary-competition-entry">
    <h1 id="temporary-competition-entry">مسابقات</h1>
    <div className="tournament-directory__tabs" role="tablist" aria-label="وضعیت مسابقات" ref={tabList}>
      {directoryTabs.map(({ key, label }, index) => <button
        type="button"
        role="tab"
        id={'temporary-tab-' + key}
        aria-controls={'temporary-' + key}
        aria-selected={view === key}
        tabIndex={view === key ? 0 : -1}
        key={key}
        onClick={() => selectTab(key)}
        onKeyDown={event => handleArrow(event, index)}
      >{label}</button>)}
    </div>
    {directoryTabs.map(({ key }) => <section
      key={key}
      role="tabpanel"
      id={'temporary-' + key}
      aria-labelledby={'temporary-tab-' + key}
      aria-busy={key === 'active' && activePending}
      hidden={view !== key}
      tabIndex={0}
    >
      {lists[key].length > 0 ? <TournamentCards entries={lists[key]} /> : <p>{empty[key]}</p>}
      {key === 'active' && view === 'active' && activeContent}
    </section>)}
  </section>;
}
