import React, { useState } from 'react';

const matches = [
  { key: 'semifinal_one', title: 'نیمه‌نهایی اول', players: [{ key: 'ramesh', name: 'رامش', id: '95m', initial: 'ر' }, { key: 'saeed', name: 'سعید', id: '_34EED', initial: 'س' }] },
  { key: 'semifinal_two', title: 'نیمه‌نهایی دوم', players: [{ key: 'hana', name: 'هانا', id: 'HANA1272', initial: 'ه' }, { key: 'lavin', name: 'لاوین', id: 'LVIN', initial: 'ل' }] },
];

export default function ChampionPrediction() {
  const [voter, setVoter] = useState('');
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    const voterPlatoId = voter.trim();
    if (!/^[A-Za-z0-9_]{2,30}$/.test(voterPlatoId)) {
      setMessage('لطفاً Plato ID معتبر خود را با حروف انگلیسی وارد کنید.');
      return;
    }
    if (!choices.semifinal_one || !choices.semifinal_two) {
      setMessage('لطفاً برنده هر دو مسابقه نیمه‌نهایی را انتخاب کنید.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-semifinal-prediction-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'sb_publishable_fuY9xR6e5pGB-6SnoV4-Hg_LNr23RzE' },
        body: JSON.stringify({
          voterPlatoId,
          semifinalOneWinnerKey: choices.semifinal_one,
          semifinalTwoWinnerKey: choices.semifinal_two,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ثبت پیش‌بینی انجام نشد.');
      setDone(true);
      setMessage('پیش‌بینی هر دو مسابقه با موفقیت ثبت شد. سپاس از شرکت شما!');
    } catch (error: any) {
      setMessage(error?.message || 'ارتباط با سامانه برقرار نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="prediction-page" dir="rtl">
    <style>{`
      *{box-sizing:border-box}
      .prediction-page{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,#39250b 0%,#100d08 42%,#050505 100%);color:#fff;padding:28px 16px 50px;font-family:Vazirmatn,Tahoma,sans-serif}
      .pred-wrap{max-width:900px;margin:auto}
      .pred-brand{text-align:center;color:#f8d46c;font-family:Georgia,serif;font-size:clamp(30px,6vw,52px);font-weight:900;letter-spacing:2px;text-shadow:0 2px 20px #e99b20}
      .pred-title{text-align:center;font-size:clamp(20px,4vw,30px);margin:8px 0 12px;color:#ffe6a1}
      .pred-note{max-width:760px;margin:0 auto 24px;padding:14px 18px;border:1px solid #a8792d;border-radius:14px;background:#211607;text-align:center;line-height:2;font-size:14px}
      .pred-match{margin:18px 0;padding:18px;border:1px solid #74531f;border-radius:16px;background:linear-gradient(145deg,#21190d,#090909)}
      .pred-match h2{text-align:center;color:#f5d58c;font-size:20px;margin:0 0 16px}
      .pred-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .pred-card{border:1px solid #74531f;background:linear-gradient(145deg,#17130d,#090909);border-radius:14px;padding:14px 8px;text-align:center;color:white;cursor:pointer;min-width:0}
      .pred-card.selected{border:2px solid #ffd76a;box-shadow:0 0 22px #d99b2d55;background:linear-gradient(145deg,#4a310d,#17100a)}
      .pred-card:disabled{cursor:default;opacity:.9}
      .pred-avatar{width:72px;height:72px;border-radius:50%;margin:0 auto 9px;border:3px solid #e9b64c;background:radial-gradient(circle at 35% 25%,#72552b,#17110a 70%);display:grid;place-items:center;font-size:32px;color:#ffe3a0}
      .pred-name{font-size:19px;font-weight:800}
      .pred-id{direction:ltr;font-family:Arial,sans-serif;font-size:13px;color:#f3d58a;margin-top:4px;overflow-wrap:anywhere}
      .pred-check{display:flex;justify-content:center;align-items:center;gap:7px;margin-top:10px;color:#d9c18a;font-size:13px}
      .pred-check input{accent-color:#e8b94e;width:17px;height:17px}
      .pred-form{max-width:560px;margin:24px auto 0;border:1px solid #926b2b;background:#17120b;border-radius:16px;padding:20px}
      .pred-form label{display:block;margin-bottom:8px;color:#ffe2a0;font-weight:700}
      .pred-form input[type=text]{width:100%;padding:13px 14px;border-radius:9px;border:1px solid #765a2b;background:#080808;color:white;direction:ltr;text-align:left;font:16px Arial,sans-serif}
      .pred-submit{width:100%;margin-top:15px;padding:14px;border:0;border-radius:9px;background:linear-gradient(110deg,#ffe49b,#c58d25);font-weight:900;font-size:16px;color:#241703}
      .pred-submit:disabled{opacity:.55;cursor:not-allowed}
      .pred-message{text-align:center;margin-top:14px;line-height:1.9;color:#ffe3a0}
      .pred-foot{text-align:center;color:#9d927c;font-size:12px;margin-top:18px}
      @media(max-width:560px){.prediction-page{padding:20px 10px 35px}.pred-match{padding:12px 9px}.pred-grid{gap:9px}.pred-avatar{width:64px;height:64px}.pred-name{font-size:17px}.pred-form{padding:16px}}
    `}</style>
    <div className="pred-wrap">
      <header><div className="pred-brand">♛ PLATO LAND ♛</div><h1 className="pred-title">پیش‌بینی صعودکنندگان به فینال سری اول لیگ تخته</h1></header>
      <section className="pred-note"><strong>شرکت در این پیش‌بینی مخصوص اعضای گروه PLATO LAND است.</strong><br/>برای ثبت پیش‌بینی، باید عضو و در گروه PLATO LAND فعال باشید. عضویت و فعال بودن شما توسط Owner و مدیریت گروه PLATO LAND بررسی خواهد شد.</section>
      <p style={{textAlign:'center',color:'#f5d58c',lineHeight:2}}>برنده هر دو مسابقه نیمه‌نهایی را انتخاب کنید تا پیش‌بینی صعودکنندگان به فینال ثبت شود.</p>
      {matches.map(match => <section className="pred-match" key={match.key}>
        <h2>{match.title}</h2>
        <div className="pred-grid" aria-label={match.title}>
          {match.players.map(player => <button type="button" key={player.key} className={'pred-card '+(choices[match.key]===player.key?'selected':'')} onClick={()=>!done&&setChoices(current=>({...current,[match.key]:player.key}))} disabled={done}>
            <span className="pred-avatar">{player.initial}</span><div className="pred-name">{player.name}</div><div className="pred-id">Plato ID: {player.id}</div><span className="pred-check"><input type="radio" name={match.key} checked={choices[match.key]===player.key} readOnly/> انتخاب این بازیکن</span>
          </button>)}
        </div>
      </section>)}
      <section className="pred-form">
        <label htmlFor="voter-plato-id">Plato ID شما</label>
        <input id="voter-plato-id" type="text" value={voter} onChange={event=>setVoter(event.target.value)} placeholder="Enter your Plato ID" autoComplete="off" disabled={done}/>
        <button className="pred-submit" onClick={submit} disabled={busy||done}>{busy?'در حال ثبت پیش‌بینی…':done?'پیش‌بینی ثبت شد':'ثبت پیش‌بینی من'}</button>
        {message&&<div className="pred-message" role="status">{message}</div>}
        <p className="pred-foot">هر Plato ID فقط یک بار می‌تواند پیش‌بینی ثبت کند. پس از ثبت، امکان تغییر پیش‌بینی وجود ندارد.</p>
      </section>
      <div className="pred-foot">PLATO LAND — بازی، رقابت، قهرمانی</div>
    </div>
  </main>;
}
