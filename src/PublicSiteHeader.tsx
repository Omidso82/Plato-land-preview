import { useEffect, useRef, useState } from 'react';
import { Crown, Menu, UserRound, X } from 'lucide-react';
import './publicSiteHeader.css';

type PublicPage = 'home' | 'tournaments' | 'news' | 'guide' | 'about' | 'account';

const links: readonly { key: PublicPage; label: string; href: string }[] = [
  { key: 'home', label: 'صفحهٔ اصلی', href: '/' },
  { key: 'tournaments', label: 'مسابقات', href: '/#temporary-competition-entry' },
  { key: 'news', label: 'اخبار و اطلاعیه‌ها', href: '/?page=news' },
  { key: 'guide', label: 'راهنما', href: '/?page=guide' },
  { key: 'about', label: 'دربارهٔ ما', href: '/?page=about' },
  { key: 'account', label: 'حساب کاربری', href: '/account/' },
];

export default function PublicSiteHeader({ current }: { current: PublicPage }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return <header className="public-site-header" dir="rtl" ref={header}>
    <a className="public-site-header__brand" href="/" aria-label="صفحهٔ اصلی پلاتولند">
      <span><Crown size={21} aria-hidden="true"/></span>
      <strong dir="ltr">PLATO <em>LAND</em></strong>
    </a>
    <div className="public-site-header__actions">
      <a className="public-site-header__control" href="/account/" aria-label="حساب کاربری">
        <UserRound size={20} aria-hidden="true"/>
      </a>
      <button ref={trigger} className="public-site-header__control" type="button"
        aria-expanded={open} aria-controls="public-site-navigation" onClick={() => setOpen(!open)}>
        {open ? <X size={20} aria-hidden="true"/> : <Menu size={20} aria-hidden="true"/>}
        منو
      </button>
    </div>
    <nav id="public-site-navigation" aria-label="منوی اصلی" hidden={!open}>
      {links.map(({ key, label, href }) => <a key={key} href={href}
        aria-current={key === current ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</a>)}
    </nav>
  </header>;
}
