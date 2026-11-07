import { memo, useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, goTo, ScrollTrigger } from '../lib/motion'
import { profile, contactSticker } from '../data'

/* ═════════ styles (kept in this file; React 19 hoists the <style> into <head> once) ═════════ */
const CSS = `
/* ═════════════════════════════════════════════════════════════
   Contact "transmission console" + footer.
   Every selector is scoped under #contact and uses new .cx-* names, so it wins over earlier contact styles
   regardless of import order.
   ═════════════════════════════════════════════════════════════ */
@property --cx-a { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
@property --mp { syntax: '<number>'; initial-value: 0; inherits: true; }

#contact.contact {
  --cx-blue: #2f7bff; --cx-cyan: #38bdf8; --cx-ink: #eaf2ff; --cx-mute: #9fb4d6; --cx-line: rgba(143, 184, 255, 0.18);
  padding: 0; height: auto; background: transparent; position: relative; overflow: visible; color: var(--cx-ink);
}
#contact .cx-ico { flex: none; display: block; }

/* ───────── stage: portal on the left (3D), console on the right ───────── */
#contact .cx-track { position: relative; height: 210svh; }
#contact .cx-stage { position: sticky; top: 0; height: 100svh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 610px); align-items: center; gap: 3vw; padding-top: 76px; padding-bottom: 26px; }
html:not(.has-3d) #contact .cx-track { height: auto; padding-block: 90px; }
html:not(.has-3d) #contact .cx-stage { position: static; height: auto; }

/* status chips that float over the portal */
#contact .cx-hud { grid-column: 1; grid-row: 1; align-self: end; display: flex; flex-wrap: wrap; gap: 10px; }
#contact .cx-chip { display: inline-flex; align-items: center; gap: 9px; padding: 9px 15px; border-radius: 999px; font-size: 13px; color: var(--cx-mute); background: rgba(7, 16, 36, 0.62); border: 1px solid var(--cx-line); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
#contact .cx-chip b { color: var(--cx-ink); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
#contact .cx-chip em { font-style: normal; font-weight: 700; color: #fbbf77; }
#contact .cx-chip i { width: 8px; height: 8px; border-radius: 50%; background: #fbbf77; }
#contact .cx-clock.is-on em { color: #86efac; }
#contact .cx-clock.is-on i { background: #4ade80; animation: cx-ping 2s infinite; }
#contact .cx-bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; }
#contact .cx-bars b { width: 3px; border-radius: 2px; background: var(--cx-cyan); animation: cx-bar 1.2s ease-in-out infinite; }
#contact .cx-bars b:nth-child(1) { height: 6px; } #contact .cx-bars b:nth-child(2) { height: 11px; animation-delay: 0.2s; } #contact .cx-bars b:nth-child(3) { height: 14px; animation-delay: 0.4s; }
@keyframes cx-bar { 50% { transform: scaleY(0.45); } }
@keyframes cx-ping { 70% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); } 0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.55); } }

/* ───────── the card ───────── */
#contact .cx-card {
  --mx: 50%; --my: 0%;
  grid-column: 2; grid-row: 1; position: relative; max-height: calc(100svh - 104px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: none;
  padding: 24px 28px 22px; border-radius: 28px; will-change: transform;
  background: linear-gradient(155deg, rgba(14, 32, 66, 0.86), rgba(5, 12, 28, 0.9));
  -webkit-backdrop-filter: blur(18px) saturate(1.4); backdrop-filter: blur(18px) saturate(1.4);
  box-shadow: 0 40px 120px -30px rgba(0, 6, 22, 0.85), 0 0 90px -34px rgba(56, 189, 248, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.07);
}
#contact .cx-card::-webkit-scrollbar { display: none; }
/* orbiting light along the card edge */
#contact .cx-card::before { content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px; pointer-events: none; z-index: 2;
  background: conic-gradient(from var(--cx-a), transparent 0 52%, rgba(47, 123, 255, 0.9) 70%, #8fe3ff 82%, transparent 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); animation: cx-spin 7s linear infinite; }
@keyframes cx-spin { to { --cx-a: 360deg; } }
/* cursor spotlight */
#contact .cx-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: radial-gradient(460px circle at var(--mx) var(--my), rgba(110, 175, 255, 0.13), transparent 62%); }
#contact .cx-card > * { position: relative; z-index: 1; }

#contact .cx-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
#contact .cx-live { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px 5px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #9be7ff; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); }
#contact .cx-live i { width: 7px; height: 7px; border-radius: 50%; background: var(--cx-cyan); box-shadow: 0 0 10px var(--cx-cyan); animation: cx-blink 1.6s ease-in-out infinite; }
@keyframes cx-blink { 50% { opacity: 0.25; } }
#contact .cx-kicker { font-size: 11.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--cx-mute); font-weight: 700; }

#contact .cx-title { font: 800 clamp(36px, 3.9vw, 58px)/0.95 var(--display); letter-spacing: -0.045em; margin: 0; }
#contact .cx-line { display: block; }
#contact .cx-ch { display: inline-block; overflow: hidden; vertical-align: top; padding: 0 0.01em 0.1em; margin-bottom: -0.1em; }
#contact .cx-ch > i { display: inline-block; font-style: normal; transition: transform 0.45s var(--ease, cubic-bezier(0.22, 1, 0.36, 1)), color 0.3s; }
#contact .cx-ch:hover > i { transform: translateY(-9%) skewX(-6deg); color: #8fe3ff; }
#contact .cx-line.is-hot .cx-ch > i { color: #8fd8ff; text-shadow: 0 0 30px rgba(47, 123, 255, 0.75); animation: cx-glint 3.6s ease-in-out infinite; animation-delay: calc(var(--i, 0) * 0.12s); }
@keyframes cx-glint { 0%, 70%, 100% { color: #8fd8ff; } 85% { color: #ffffff; text-shadow: 0 0 34px rgba(143, 227, 255, 1); } }
#contact .cx-lead { margin: 12px 0 0; font-size: 14.5px; line-height: 1.6; color: var(--cx-mute); max-width: 46ch; }

/* ───────── form ───────── */
#contact .cx-form { display: grid; gap: 11px; margin-top: 16px; }
#contact .cx-topics { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 7px; }
#contact .cx-topics legend { float: left; width: 100%; padding: 0; margin-bottom: 8px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cx-mute); }
#contact .cx-topics label { position: relative; cursor: pointer; }
#contact .cx-topics input { position: absolute; opacity: 0; inset: 0; }
#contact .cx-topics span { display: block; padding: 7px 13px; border-radius: 999px; font-size: 13px; font-weight: 700; color: var(--cx-mute); border: 1px solid var(--cx-line); background: rgba(5, 12, 28, 0.5); transition: color 0.25s, background 0.35s, border-color 0.3s, transform 0.4s var(--ease, ease); }
#contact .cx-topics label:hover span { color: #fff; transform: translateY(-2px); border-color: rgba(143, 184, 255, 0.45); }
#contact .cx-topics .is-on span { color: #fff; border-color: transparent; background: linear-gradient(100deg, #2f7bff, #38bdf8); box-shadow: 0 8px 24px -10px rgba(47, 123, 255, 0.9); }
#contact .cx-topics input:focus-visible + span { outline: 2px solid var(--cx-cyan); outline-offset: 2px; }

#contact .cx-row { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
#contact .cx-field { position: relative; }
#contact .cx-field input, #contact .cx-field textarea { width: 100%; padding: 22px 14px 8px; border-radius: 13px; border: 1px solid var(--cx-line); background: rgba(4, 10, 24, 0.62); color: var(--cx-ink); font: inherit; font-size: 15px; outline: none; resize: none; transition: border-color 0.3s, box-shadow 0.35s, background 0.3s; }
#contact .cx-field textarea { min-height: 96px; padding-bottom: 22px; }
#contact .cx-field label { position: absolute; left: 15px; top: 15px; max-width: calc(100% - 30px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; pointer-events: none; font-size: 14px; color: #7d93b8; transform-origin: 0 0; transition: transform 0.3s var(--ease, ease), color 0.3s; }
#contact .cx-field input:focus + label, #contact .cx-field input:not(:placeholder-shown) + label,
#contact .cx-field textarea:focus + label, #contact .cx-field textarea:not(:placeholder-shown) + label { transform: translateY(-9px) scale(0.8); color: var(--cx-cyan); }
#contact .cx-field input:focus, #contact .cx-field textarea:focus { border-color: rgba(56, 189, 248, 0.75); background: rgba(6, 16, 36, 0.85); box-shadow: 0 0 0 4px rgba(47, 123, 255, 0.16), 0 10px 30px -14px rgba(56, 189, 248, 0.6); }
#contact .cx-field.is-invalid input, #contact .cx-field.is-invalid textarea { border-color: #f87171; box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.14); }
#contact .cx-field.is-invalid label { color: #fca5a5; }
#contact .cx-count { position: absolute; right: 12px; bottom: 7px; font-size: 11px; color: #6b82a8; font-variant-numeric: tabular-nums; pointer-events: none; }
#contact .cx-honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

#contact .cx-send { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
#contact .cx-submit { position: relative; isolation: isolate; display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 26px; border-radius: 999px; font-weight: 800; font-size: 15px; color: #fff; overflow: visible; will-change: transform; box-shadow: 0 16px 40px -14px rgba(47, 123, 255, 0.95); }
#contact .cx-submit-bg { position: absolute; inset: 0; z-index: -1; border-radius: inherit; overflow: hidden; background: linear-gradient(100deg, #2f7bff, #38bdf8 55%, #2f7bff); background-size: 200% 100%; transition: background-position 0.8s var(--ease, ease); }
#contact .cx-submit-bg::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; left: -60%; background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.45), transparent); transform: skewX(-20deg); animation: cx-sheen 3.8s ease-in-out infinite; }
@keyframes cx-sheen { 0%, 55% { left: -60%; } 100% { left: 130%; } }
#contact .cx-submit:hover .cx-submit-bg { background-position: 100% 0; }
#contact .cx-submit:hover .cx-ico { transform: translate(3px, -3px) rotate(8deg); }
#contact .cx-submit .cx-ico { transition: transform 0.45s var(--ease, ease); }
#contact .cx-submit.is-success .cx-submit-bg { background: linear-gradient(100deg, #16a34a, #22c55e); }
#contact .cx-submit:disabled { cursor: progress; }
#contact .cx-submit:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
#contact .cx-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff; animation: cx-rot 0.8s linear infinite; }
@keyframes cx-rot { to { transform: rotate(360deg); } }
#contact .cx-burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
#contact .cx-burst i { position: absolute; width: 8px; height: 12px; border-radius: 2px; left: -4px; top: -6px; }
#contact .cx-note { font-size: 12.5px; color: #7d93b8; margin: 0; }
#contact .cx-note kbd { font: 700 11px var(--display, inherit); padding: 1px 6px; border-radius: 5px; border: 1px solid var(--cx-line); background: rgba(5, 12, 28, 0.6); color: var(--cx-mute); }
#contact .cx-feedback { margin: 0; min-height: 0; font-size: 13.5px; line-height: 1.5; }
#contact .cx-feedback:empty { display: none; }
#contact .cx-feedback.is-success { color: #86efac; } #contact .cx-feedback.is-error { color: #fca5a5; } #contact .cx-feedback.is-unconfigured { color: #fcd34d; } #contact .cx-feedback.is-sending { color: var(--cx-mute); }

/* email + social tiles */
#contact .cx-reach { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--cx-line); }
#contact .cx-mail { display: flex; align-items: center; gap: 8px; min-width: 0; }
#contact .cx-mail a { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-weight: 700; font-size: 14.5px; color: var(--cx-ink); background: linear-gradient(var(--cx-cyan), var(--cx-cyan)) 0 100% / 0 2px no-repeat; transition: background-size 0.5s var(--ease, ease), color 0.3s; overflow-wrap: anywhere; }
#contact .cx-mail a:hover { background-size: 100% 2px; color: #fff; }
#contact .cx-mail button { flex: none; padding: 6px 12px; border-radius: 9px; font-size: 12px; font-weight: 800; border: 1px solid var(--cx-line); color: var(--cx-mute); transition: background 0.3s, color 0.3s, border-color 0.3s; }
#contact .cx-mail button:hover { color: #fff; border-color: rgba(143, 184, 255, 0.5); }
#contact .cx-mail button.is-ok { background: rgba(34, 197, 94, 0.2); border-color: rgba(74, 222, 128, 0.6); color: #86efac; }
#contact .cx-mail button.is-err { background: rgba(248, 113, 113, 0.16); color: #fca5a5; }
#contact .cx-socials { display: flex; gap: 8px; }
#contact .cx-tile { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; color: var(--cx-mute); border: 1px solid var(--cx-line); background: rgba(5, 12, 28, 0.55); will-change: transform; transition: color 0.3s, background 0.35s, border-color 0.3s, box-shadow 0.35s; }
#contact .cx-tile:hover, #contact .cx-tile:focus-visible { color: #fff; background: linear-gradient(135deg, rgba(47, 123, 255, 0.55), rgba(56, 189, 248, 0.4)); border-color: rgba(143, 227, 255, 0.6); box-shadow: 0 12px 28px -10px rgba(47, 123, 255, 0.9); }

/* ═════════ footer ═════════ */
#contact .cx-footer { position: relative; z-index: 3; overflow: hidden; margin-top: -2svh; background: linear-gradient(180deg, transparent 0, rgba(3, 8, 20, 0.88) 16%, #030814 38%); }
#contact .cx-footer::before { content: ''; position: absolute; left: 50%; top: 14%; width: min(900px, 90vw); aspect-ratio: 1; translate: -50% 0; border-radius: 50%; background: radial-gradient(circle, rgba(47, 123, 255, 0.2), transparent 65%); pointer-events: none; }

#contact .cx-marquee { position: relative; margin: 14svh -3vw 0; padding: 15px 0; transform: rotate(-1.4deg); overflow: hidden; border-block: 1px solid var(--cx-line); background: linear-gradient(90deg, rgba(47, 123, 255, 0.18), rgba(56, 189, 248, 0.1), rgba(47, 123, 255, 0.18)); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
#contact .cx-marquee-track { display: flex; width: max-content; animation: cx-marq 40s linear infinite; }
#contact .cx-marquee:hover .cx-marquee-track { animation-play-state: paused; }
#contact .cx-marquee-set { display: flex; flex: none; }
#contact .cx-marquee-set span { display: inline-flex; align-items: center; white-space: nowrap; font: 800 clamp(18px, 2.1vw, 30px) var(--display); text-transform: uppercase; letter-spacing: 0.04em; color: #cfe0ff; }
#contact .cx-marquee-set span:nth-child(even) { color: transparent; -webkit-text-stroke: 1px rgba(159, 195, 255, 0.75); }
#contact .cx-marquee-set em { font-style: normal; margin: 0 clamp(18px, 2.2vw, 36px); color: var(--cx-cyan); font-size: 0.7em; }
@keyframes cx-marq { to { transform: translateX(-50%); } }

#contact .cx-foot-grid { position: relative; display: grid; grid-template-columns: 1.5fr 0.7fr 0.7fr; gap: clamp(30px, 5vw, 80px); padding-block: 9svh 4svh; }
#contact .cx-foot-brand { position: relative; padding-bottom: 6px; }
#contact .cx-foot-big { margin: 0 0 24px; max-width: 16em; font: 700 clamp(26px, 3.1vw, 46px)/1.08 var(--display); letter-spacing: -0.035em; }
#contact .cx-cta { display: inline-flex; align-items: center; gap: 10px; height: 54px; padding: 0 28px; border-radius: 999px; font-weight: 800; font-size: 15.5px; color: #061024; background: #eaf2ff; will-change: transform; box-shadow: 0 18px 44px -16px rgba(143, 200, 255, 0.7); transition: background 0.35s, color 0.35s, box-shadow 0.35s; }
#contact .cx-cta:hover { background: linear-gradient(100deg, #2f7bff, #38bdf8); color: #fff; }
#contact .cx-cta .cx-ico { transition: transform 0.45s var(--ease, ease); } #contact .cx-cta:hover .cx-ico { transform: translate(3px, -3px); }
#contact .cx-foot-sticker { position: absolute; right: 0; bottom: -6px; height: clamp(90px, 9vw, 140px); width: auto; filter: hue-rotate(207deg) saturate(1.15) drop-shadow(0 12px 18px rgba(0, 8, 30, 0.55)); animation: cx-float 5s ease-in-out infinite; pointer-events: none; }
@keyframes cx-float { 50% { transform: translateY(-10px) rotate(2deg); } }

#contact .cx-foot-col { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
#contact .cx-foot-col h3 { margin: 0 0 12px; font: 800 11.5px var(--display); letter-spacing: 0.22em; text-transform: uppercase; color: var(--cx-cyan); }
#contact .cx-foot-col a { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; font-size: 16px; font-weight: 600; color: var(--cx-mute); transition: color 0.3s, transform 0.45s var(--ease, ease); }
#contact .cx-foot-col a .cx-ico { opacity: 0; transform: translate(-6px, 6px); transition: opacity 0.3s, transform 0.45s var(--ease, ease); color: var(--cx-cyan); }
#contact .cx-foot-col a:hover { color: #fff; transform: translateX(6px); }
#contact .cx-foot-col a:hover .cx-ico { opacity: 1; transform: none; }

/* giant wordmark: outline always visible, solid fill sweeps in with scroll (--mp 0→1) */
#contact .cx-mega { position: relative; margin: 2svh 0 0; text-align: center; font: 800 clamp(84px, 23vw, 380px)/0.8 var(--display); letter-spacing: -0.06em; white-space: nowrap; user-select: none; pointer-events: none; padding-bottom: 0.06em; }
#contact .cx-mega-line { display: block; color: transparent; -webkit-text-stroke: 1.5px rgba(143, 184, 255, 0.38); }
#contact .cx-mega-fill { position: absolute; inset: 0 0 auto 0; display: block; padding-bottom: 0.06em; background: linear-gradient(180deg, #a9c8ff 0%, #2f7bff 55%, #0b2a63 100%); -webkit-background-clip: text; background-clip: text; color: transparent; clip-path: inset(0 calc((1 - var(--mp, 0)) * 100%) 0 0); filter: drop-shadow(0 0 40px rgba(47, 123, 255, 0.45)); }

#contact .cx-foot-bottom { position: relative; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px 28px; padding-block: 18px 30px; border-top: 1px solid var(--cx-line); font-size: 13.5px; color: #7d93b8; }
#contact .cx-built { margin-left: auto; }
#contact .cx-open { display: inline-flex; align-items: center; gap: 8px; color: #86efac; font-weight: 700; }
#contact .cx-open i { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: cx-ping 2s infinite; }
#contact .cx-top-btn { position: relative; display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; color: #fff; will-change: transform; background: rgba(47, 123, 255, 0.16); transition: background 0.3s, box-shadow 0.35s; }
#contact .cx-top-btn:hover { background: linear-gradient(135deg, #2f7bff, #38bdf8); box-shadow: 0 14px 34px -10px rgba(47, 123, 255, 0.95); }
#contact .cx-top-btn svg:first-child { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
#contact .cx-ring-bg { fill: none; stroke: rgba(143, 184, 255, 0.22); stroke-width: 2.5; }
#contact .cx-ring { fill: none; stroke: #8fe3ff; stroke-width: 2.5; stroke-linecap: round; }
#contact .cx-top-btn .cx-ico { transition: transform 0.45s var(--ease, ease); } #contact .cx-top-btn:hover .cx-ico { transform: translateY(-3px); }

/* ───────── shorter laptops ───────── */
@media (min-width: 901px) and (max-height: 800px) {
  #contact .cx-lead, #contact .cx-note { display: none; }
  #contact .cx-card { padding: 18px 24px 16px; }
  #contact .cx-title { font-size: clamp(32px, 3.4vw, 48px); }
  #contact .cx-form { margin-top: 12px; gap: 9px; }
  #contact .cx-reach { margin-top: 12px; padding-top: 12px; }
}

/* ───────── tablet & phone ───────── */
@media (max-width: 900px) {
  #contact .cx-track { height: auto; padding: 34svh 0 8svh; }
  #contact .cx-stage { position: static; height: auto; display: flex; flex-direction: column; gap: 14px; padding: 0; }
  #contact .cx-hud { order: -1; align-self: stretch; }
  #contact .cx-card { max-height: none; overflow: visible; padding: 20px 18px 18px; border-radius: 24px; }
  #contact .cx-title { font-size: clamp(34px, 11vw, 52px); }
  #contact .cx-chip { padding: 7px 12px; font-size: 12px; }
  #contact .cx-foot-grid { grid-template-columns: 1fr 1fr; padding-top: 7svh; }
  #contact .cx-foot-brand { grid-column: 1 / -1; }
  #contact .cx-foot-sticker { height: 84px; }
  #contact .cx-marquee { margin-top: 9svh; }
}
@media (max-width: 560px) {
  #contact .cx-row { grid-template-columns: 1fr; }
  #contact .cx-send { align-items: stretch; flex-direction: column; gap: 10px; }
  #contact .cx-submit { justify-content: center; }
  #contact .cx-reach { flex-direction: column; align-items: flex-start; }
  #contact .cx-foot-grid { grid-template-columns: 1fr; }
  #contact .cx-foot-bottom { flex-direction: column; align-items: flex-start; }
  #contact .cx-built { margin-left: 0; }
  #contact .cx-top-btn { align-self: flex-end; }
}

@media (prefers-reduced-motion: reduce) {
  #contact .cx-card::before, #contact .cx-marquee-track, #contact .cx-foot-sticker, #contact .cx-submit-bg::after, #contact .cx-line.is-hot .cx-ch > i,
  #contact .cx-live i, #contact .cx-clock.is-on i, #contact .cx-open i, #contact .cx-bars b { animation: none; }
  #contact .cx-mega-fill { clip-path: none; }
}
`

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || ''

const initialForm = { name: '', email: '', message: '', botcheck: '' }
const TOPICS = ['New project', 'Collaboration', 'Hiring', 'Just saying hi']
const MARQUEE = ['Available for work', 'React', 'Three.js', 'Node.js', 'Creative development', 'Let’s build something amazing']
const EXPLORE = [['Home', '#top'], ['About', '#about'], ['Toolbox', '#skills'], ['Journey', '#journey'], ['Experience', '#experience'], ['Work', '#work'], ['GitHub', '#github'], ['Contact', '#contact']]
const RING = 2 * Math.PI * 24

/* ───────── tiny inline icons ───────── */
const PATHS = {
  github: <path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />,
  linkedin: <path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />,
  instagram: <g fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" /></g>,
  mail: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7.5 8 6 8-6" /></g>,
  send: <path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="M21 3 10 14M21 3l-6.5 18-3.5-7-7-3.5L21 3z" />,
  up: <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6 6-6 6 6" />,
  arrow: <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" />,
}
const Icon = ({ name, size = 20 }) => <svg className="cx-ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>

/* ───────── live clock + availability (own state, so it never re-renders the form) ───────── */
const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const Clock = memo(function Clock() {
  const [t, setT] = useState(() => ist.format(new Date()))
  useEffect(() => { const id = setInterval(() => setT(ist.format(new Date())), 1000); return () => clearInterval(id) }, [])
  const h = parseInt(t.slice(0, 2), 10)
  const online = h >= 9 && h < 23
  return (
    <div className={`cx-chip cx-clock ui${online ? ' is-on' : ''}`}>
      <i aria-hidden="true" />
      <span><b>{t}</b> IST</span>
      <em>{online ? 'Online now' : 'Back at 09:00'}</em>
    </div>
  )
})

/* headline split into masked characters (for the reveal + the hover/glint effects) */
const Line = ({ text, hot }) => (
  <span className={`cx-line${hot ? ' is-hot' : ''}`}>
    {[...text].map((c, n) => (c === ' ' ? ' ' : <span className="cx-ch" key={n}><i style={hot ? { '--i': n } : undefined}>{c}</i></span>))}
  </span>
)

export default function Contact() {
  const root = useRef(null)
  const card = useRef(null)
  const nameInput = useRef(null)
  const burstBox = useRef(null)
  const ring = useRef(null)
  const timers = useRef({})
  const tilt = useRef({})

  const [copyStatus, setCopyStatus] = useState('idle')
  const [form, setForm] = useState(initialForm)
  const [topic, setTopic] = useState(TOPICS[0])
  const [invalid, setInvalid] = useState('')
  const [submitState, setSubmitState] = useState('idle')
  const [feedback, setFeedback] = useState('')

  /* ───────── motion ───────── */
  const { contextSafe } = useGSAP(() => {
    const el = root.current
    const mm = gsap.matchMedia()

    // page scroll progress drives the ring around the back-to-top button
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - s.progress)) } })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(card.current, { transformPerspective: 1200 })
      tilt.current = { x: gsap.quickTo(card.current, 'rotationX', { duration: 0.7, ease: 'power3.out' }), y: gsap.quickTo(card.current, 'rotationY', { duration: 0.7, ease: 'power3.out' }) }

      // the console powers on as the portal opens
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 38%', once: true }, defaults: { ease: 'power4.out' } })
        .from('.cx-card', { autoAlpha: 0, y: 60, scale: 0.94, duration: 1.1 })
        .from('.cx-ch > i', { yPercent: 118, rotate: 5, stagger: 0.018, duration: 0.95 }, 0.2)
        .from('.cx-card .cx-in', { y: 22, autoAlpha: 0, stagger: 0.06, duration: 0.7 }, 0.45)
        .from('.cx-chip', { x: -30, autoAlpha: 0, stagger: 0.1, duration: 0.8 }, 0.5)

      // footer: marquee slides in, columns stagger, the giant wordmark fills with scroll
      gsap.from('.cx-marquee', { yPercent: 100, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.cx-footer', start: 'top 85%', once: true } })
      gsap.from('.cx-foot-grid > *', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.cx-foot-grid', start: 'top 88%', once: true } })
      gsap.fromTo('.cx-mega', { '--mp': 0 }, { '--mp': 1, ease: 'none', scrollTrigger: { trigger: '.cx-mega', start: 'top 98%', end: 'top 38%', scrub: true } })
      gsap.from('.cx-foot-bottom', { autoAlpha: 0, y: 20, duration: 0.8, scrollTrigger: { trigger: '.cx-foot-bottom', start: 'top 100%', once: true } })
    })
    return () => { mm.revert(); Object.values(timers.current).forEach((t) => window.clearTimeout(t)) }
  }, { scope: root })

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  const burst = contextSafe(() => {
    const box = burstBox.current
    if (!box || reduced()) return
    const colors = ['#2F7BFF', '#38BDF8', '#7C9CFF', '#EAF2FF', '#6FA8FF']
    for (let n = 0; n < 38; n++) {
      const d = document.createElement('i')
      d.style.background = colors[n % colors.length]
      box.appendChild(d)
      const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 190
      gsap.fromTo(d, { x: 0, y: 0, scale: 0, rotation: 0, autoAlpha: 1 }, {
        x: Math.cos(a) * r, y: Math.sin(a) * r - 70, scale: 0.6 + Math.random() * 1.1, rotation: Math.random() * 540, duration: 1 + Math.random() * 0.5, ease: 'power3.out',
        onComplete: () => { gsap.to(d, { y: '+=130', autoAlpha: 0, duration: 0.7, ease: 'power1.in', onComplete: () => d.remove() }) },
      })
    }
  })
  const shake = contextSafe(() => { if (!reduced()) gsap.fromTo('.cx-form', { x: -9 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.25)' }) })

  /* cursor spotlight + gentle tilt on the card; magnetic pull on .cx-mag controls */
  const onMove = (e) => {
    const c = card.current
    if (c) {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
      c.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`); c.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      if (e.pointerType === 'mouse' && tilt.current.x && c.contains(e.target)) { tilt.current.y((x - 0.5) * 4); tilt.current.x(-(y - 0.5) * 3) }
    }
    const m = e.target.closest?.('.cx-mag')
    if (m && e.pointerType === 'mouse' && !reduced()) { const b = m.getBoundingClientRect(); gsap.to(m, { x: (e.clientX - b.left - b.width / 2) * 0.25, y: (e.clientY - b.top - b.height / 2) * 0.3, duration: 0.4, overwrite: 'auto' }) }
  }
  const onLeave = () => {
    tilt.current.x?.(0); tilt.current.y?.(0)
    gsap.to(root.current.querySelectorAll('.cx-mag'), { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' })
  }

  /* ───────── copy email ───────── */
  const copyEmail = async () => {
    window.clearTimeout(timers.current.copy)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(profile.email)
      setCopyStatus('copied')
    } catch { setCopyStatus('error') }
    timers.current.copy = window.setTimeout(() => setCopyStatus('idle'), 2200)
  }

  /* ───────── form ───────── */
  const updateField = (event) => {
    const { name, value } = event.target
    setForm((c) => ({ ...c, [name]: value }))
    if (invalid === name) setInvalid('')
    if (submitState === 'error' || submitState === 'unconfigured') { setSubmitState('idle'); setFeedback('') }
  }

  const validateForm = (d) => {
    if (!d.name) return ['name', 'Please tell me your name.']
    if (!d.email) return ['email', 'Please add your email so I can reply.']
    if (!d.message) return ['message', 'Write a short message first.']
    if (d.name.length > 100) return ['name', 'Your name must be under 100 characters.']
    if (d.email.length > 254) return ['email', 'Please enter a shorter email address.']
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return ['email', 'Please enter a valid email address.']
    if (d.message.length > 5000) return ['message', 'Your message must be under 5,000 characters.']
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitState === 'sending') return
    const clean = { name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), botcheck: form.botcheck }
    if (clean.botcheck) return // honeypot

    const problem = validateForm(clean)
    if (problem) { setInvalid(problem[0]); setSubmitState('error'); setFeedback(problem[1]); shake(); return }
    if (!ACCESS_KEY) { setSubmitState('unconfigured'); setFeedback('Contact form is not configured yet. Please email me directly.'); return }

    setSubmitState('sending'); setFeedback('Transmitting your message securely…')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: ACCESS_KEY, subject: `Portfolio enquiry (${topic}) from ${clean.name}`, from_name: clean.name, name: clean.name, email: clean.email, topic, message: clean.message, botcheck: '' }),
        signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.success) throw new Error(result?.message || 'Unable to send your message. Please try again.')
      setSubmitState('success'); setFeedback('Message received! Thank you — I’ll get back to you soon.'); setForm(initialForm)
      burst()
      window.clearTimeout(timers.current.reset)
      timers.current.reset = window.setTimeout(() => { setSubmitState('idle'); setFeedback('') }, 7000)
    } catch (error) {
      setSubmitState('error'); shake()
      setFeedback(error.name === 'AbortError' ? 'Request timed out. Please check your connection and try again.' : error.message || 'Something went wrong. Please try again.')
    } finally { window.clearTimeout(timeout) }
  }

  const startProject = () => {
    goTo('#contact', { offset: 0, duration: 2.4 })
    window.clearTimeout(timers.current.focus)
    timers.current.focus = window.setTimeout(() => nameInput.current?.focus({ preventScroll: true }), 2300)
  }

  const socialLinks = [
    { label: 'GitHub', icon: 'github', url: profile.github },
    { label: 'LinkedIn', icon: 'linkedin', url: profile.linkedin },
    { label: 'Instagram', icon: 'instagram', url: profile.instagram },
  ].filter((s) => s.url)
  const letters = [...profile.name.toUpperCase()]
  const sending = submitState === 'sending'

  return (
    <section className="contact section" id="contact" ref={root} aria-labelledby="contact-title" onPointerMove={onMove} onPointerLeave={onLeave}>
      <style href="contact-console-styles" precedence="default">{CSS}</style>

      {/* ═════════ the console (sticky while the portal opens behind it) ═════════ */}
      <div className="cx-track">
        <div className="wrap cx-stage">
          <div className="cx-hud" aria-label="Status">
            <Clock />
            <div className="cx-chip ui"><span className="cx-bars" aria-hidden="true"><b /><b /><b /></span><span>Replies within <b>~24h</b></span></div>
            <div className="cx-chip ui"><span>{profile.location}</span></div>
          </div>

          <div className="cx-card ui" ref={card}>
            <div className="cx-top cx-in">
              <span className="cx-live"><i aria-hidden="true" />Channel open</span>
              <span className="cx-kicker">Contact</span>
            </div>

            <h2 className="cx-title" id="contact-title">
              <Line text="Let’s build" />{' '}
              <Line text="something" />{' '}
              <Line text="amazing." hot />
            </h2>
            <p className="cx-lead cx-in">Have a project in mind, want to collaborate, or just want to say hello? Tell me a little about it. I usually reply within a day.</p>

            <form className="cx-form" onSubmit={submit} noValidate>
              <fieldset className="cx-topics cx-in">
                <legend>What’s this about?</legend>
                {TOPICS.map((t) => (
                  <label key={t} className={t === topic ? 'is-on' : undefined}>
                    <input type="radio" name="topic" value={t} checked={t === topic} onChange={() => setTopic(t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </fieldset>

              <div className="cx-row cx-in">
                <div className={`cx-field${invalid === 'name' ? ' is-invalid' : ''}`}>
                  <input ref={nameInput} id="contact-name" name="name" type="text" placeholder=" " autoComplete="name" maxLength={100} value={form.name} onChange={updateField} required aria-invalid={invalid === 'name'} />
                  <label htmlFor="contact-name">Name</label>
                </div>
                <div className={`cx-field${invalid === 'email' ? ' is-invalid' : ''}`}>
                  <input id="contact-email" name="email" type="email" placeholder=" " autoComplete="email" maxLength={254} value={form.email} onChange={updateField} required aria-invalid={invalid === 'email'} />
                  <label htmlFor="contact-email">Email</label>
                </div>
              </div>

              <div className={`cx-field cx-in${invalid === 'message' ? ' is-invalid' : ''}`}>
                <textarea id="contact-message" name="message" rows={3} placeholder=" " maxLength={5000} value={form.message} onChange={updateField}
                  onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') e.currentTarget.form.requestSubmit() }} required aria-invalid={invalid === 'message'} />
                <label htmlFor="contact-message">Tell me about your idea, project or question…</label>
                <span className="cx-count">{form.message.length}/5000</span>
              </div>

              {/* honeypot spam protection */}
              <div className="cx-honeypot" aria-hidden="true"><input type="text" name="botcheck" tabIndex={-1} autoComplete="off" value={form.botcheck} onChange={updateField} /></div>

              <div className="cx-send cx-in">
                <button className={`cx-submit cx-mag is-${submitState}`} type="submit" disabled={sending}>
                  <span className="cx-submit-bg" aria-hidden="true" />
                  {sending ? <><span className="cx-spinner" aria-hidden="true" />Sending…</>
                    : submitState === 'success' ? <>Message sent <Icon name="send" size={18} /></>
                    : <>Send message <Icon name="send" size={18} /></>}
                  <span className="cx-burst" ref={burstBox} aria-hidden="true" />
                </button>
                <p className="cx-note"><span aria-hidden="true">🔒</span> Used only to reply to you. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> sends.</p>
              </div>
              <p className={`cx-feedback is-${submitState}`} role="status" aria-live="polite">{feedback}</p>
            </form>

            <div className="cx-reach cx-in">
              <div className="cx-mail">
                <a href={`mailto:${profile.email}`}><Icon name="mail" size={16} />{profile.email}</a>
                <button type="button" className={copyStatus === 'copied' ? 'is-ok' : copyStatus === 'error' ? 'is-err' : undefined} onClick={copyEmail} aria-live="polite">
                  {copyStatus === 'copied' ? 'Copied ✓' : copyStatus === 'error' ? 'Copy failed' : 'Copy'}
                </button>
              </div>
              <div className="cx-socials" aria-label="Social links">
                {socialLinks.map((s) => (
                  <a key={s.label} className="cx-tile cx-mag" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}><Icon name={s.icon} /></a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ footer ═════════ */}
      <footer className="cx-footer ui">
        <div className="cx-marquee" aria-hidden="true">
          <div className="cx-marquee-track">
            {[0, 1].map((k) => <div className="cx-marquee-set" key={k}>{MARQUEE.map((m) => <span key={m + k}>{m}<em>✦</em></span>)}</div>)}
          </div>
        </div>

        <div className="wrap cx-foot-grid">
          <div className="cx-foot-brand">
            <p className="cx-foot-big">Got an idea? Let’s turn it into something people remember.</p>
            <button type="button" className="cx-cta cx-mag" onClick={startProject}>Start a project <Icon name="arrow" size={18} /></button>
            {contactSticker && <img className="cx-foot-sticker" src={contactSticker} alt="" loading="lazy" />}
          </div>

          <nav className="cx-foot-col" aria-label="Explore">
            <h3>Explore</h3>
            {EXPLORE.map(([label, href]) => <a key={href} href={href} onClick={(e) => { e.preventDefault(); goTo(href, href === '#top' ? { offset: 0, duration: 2.6 } : {}) }}><span>{label}</span><Icon name="arrow" size={14} /></a>)}
          </nav>

          <div className="cx-foot-col">
            <h3>Connect</h3>
            {socialLinks.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"><span>{s.label}</span><Icon name="arrow" size={14} /></a>)}
            <a href={`mailto:${profile.email}`}><span>Email</span><Icon name="arrow" size={14} /></a>
          </div>
        </div>

        <div className="cx-mega" aria-hidden="true">
          <span className="cx-mega-line">{letters.map((c, n) => <span key={n}>{c}</span>)}</span>
          <span className="cx-mega-fill">{letters.map((c, n) => <span key={n}>{c}</span>)}</span>
        </div>

        <div className="wrap cx-foot-bottom">
          <span>© {new Date().getFullYear()} {profile.full}. All rights reserved.</span>
          <span className="cx-built">Built with React, Three.js &amp; GSAP</span>
          <span className="cx-open"><i aria-hidden="true" />Open to opportunities</span>
          <button type="button" className="cx-top-btn cx-mag" aria-label="Back to the top" onClick={() => goTo('#top', { offset: 0, duration: 3 })}>
            <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="24" className="cx-ring-bg" /><circle ref={ring} cx="28" cy="28" r="24" className="cx-ring" strokeDasharray={RING} strokeDashoffset={RING} /></svg>
            <Icon name="up" size={18} />
          </button>
        </div>
      </footer>
    </section>
  )
}