import React, { useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatIranJalaliDateInput, jalaliDateToIso } from './iranDate';
import './JalaliDatePicker.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

const persianCalendar = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric'
});
const monthNames = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', month: 'long'
});
const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianDigits = (value: string | number) => String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function formatInput(value: string) {
  const digits = normalizeDigits(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + '/' + digits.slice(4);
  return digits.slice(0, 4) + '/' + digits.slice(4, 6) + '/' + digits.slice(6);
}

function parts(date: Date) {
  const values = persianCalendar.formatToParts(date);
  const get = (key: string) => Number(values.find(item => item.type === key)?.value || 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function dateForJalaliDay(year: number, month: number, day: number) {
  const iso = jalaliDateToIso(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
  return iso ? new Date(iso + 'T12:00:00Z') : null;
}

export default function JalaliDatePicker({ value, onChange, placeholder = '۱۴۰۵/۰۸/۱۵', label }: Props) {
  const initial = useMemo(() => {
    const iso = jalaliDateToIso(value);
    return iso ? parts(new Date(iso + 'T12:00:00Z')) : parts(new Date());
  }, []);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const firstDate = dateForJalaliDay(year, month, 1);
  const monthLength = Array.from({ length: 31 }, (_, i) => i + 1).filter(day => !!dateForJalaliDay(year, month, day)).length;
  const offset = firstDate ? (firstDate.getUTCDay() + 1) % 7 : 0;
  const monthLabel = firstDate ? monthNames.format(firstDate) : '';
  const yearLabel = persianDigits(year);
  const selected = formatInput(value);
  const days = [...Array(offset).fill(0), ...Array.from({ length: monthLength }, (_, i) => i + 1)];

  function moveMonth(delta: number) {
    const next = month + delta;
    if (next < 1) { setMonth(12); setYear(year - 1); }
    else if (next > 12) { setMonth(1); setYear(year + 1); }
    else setMonth(next);
  }

  function choose(day: number) {
    onChange(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  function closeCalendar() {
    setOpen(false);
    inputRef.current?.blur();
  }

  return <div className="jalali-date-picker">
    {label && <span className="jalali-date-label">{label}</span>}
    <div className="jalali-date-input-wrap">
      <input
        ref={inputRef}
        type="text"
        dir="ltr"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={event => onChange(formatInput(event.target.value))}
        aria-label={label || 'تاریخ شمسی'}
      />
      <button type="button" className="jalali-calendar-trigger" onClick={() => setOpen(v => !v)} aria-label="باز کردن تقویم شمسی">
        <CalendarDays size={19}/>
      </button>
    </div>
    {open && <div className="jalali-calendar-popover" dir="rtl" onTouchStart={() => inputRef.current?.blur()}>
      <div className="jalali-calendar-heading">
        <button type="button" onClick={() => moveMonth(-1)} aria-label="ماه قبل"><ChevronRight size={19}/></button>
        <strong>{monthLabel} {yearLabel}</strong>
        <button type="button" onClick={() => moveMonth(1)} aria-label="ماه بعد"><ChevronLeft size={19}/></button>
      </div>
      <div className="jalali-calendar-grid">
        {weekdays.map((day, index) => <span className="jalali-weekday" key={index}>{day}</span>)}
        {days.map((day, index) => day === 0
          ? <span className="jalali-calendar-empty" key={'empty-' + index}/>
          : <button type="button" key={day} className={selected === `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}` ? 'selected' : ''} onClick={() => choose(day)}>{persianDigits(day)}</button>
        )}
      </div>
      <div className="jalali-calendar-footer">
        <button type="button" onClick={() => { const today = parts(new Date()); setYear(today.year); setMonth(today.month); onChange(`${today.year}/${String(today.month).padStart(2, '0')}/${String(today.day).padStart(2, '0')}`); closeCalendar(); }}>امروز</button>
        <button type="button" onClick={closeCalendar}>بستن</button>
      </div>
    </div>}
  </div>;
}
