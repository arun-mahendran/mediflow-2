import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import authHero from "@/assets/mediflow-register.png";
// Swap this for a dedicated register background if you have one
// import registerHero from "@/assets/register-hero.jpg";
import { roleHome, useAuth } from "@/hooks/useAuth";
import { departmentApi } from "@/services/api";

const registerHero = authHero;

/* ------------------------------------------------------------------ */
/*  Styles (scoped to .mf-auth so they never leak into the rest of app) */
/* ------------------------------------------------------------------ */

const styles = `
.mf-auth{
  --paper:#f6f5f1;
  --paper-2:#eef3f1;
  --paper-3:#efeee8;
  --ink:#151a17;
  --muted:#5c655f;
  --muted-2:#8b9289;
  --placeholder:#6b756f;
  --teal:#0f6e56;
  --teal-bright:#1d9e75;
  --teal-pale:#eafbf3;
  --teal-tint:#e3f3ee;
  --coral:#d85a30;
  --coral-2:#f0997b;
  --line:rgba(15,26,20,0.08);
  --card-line:rgba(15,26,20,0.09);
  --danger:#c2410c;
  --font-display:'Space Grotesk', sans-serif;
  --font-body:'Inter', sans-serif;
  --font-mono:'JetBrains Mono', monospace;

  font-family:var(--font-body);
  color:var(--ink);
}
.mf-auth *{margin:0;padding:0;box-sizing:border-box;}

@keyframes mfFadeDown{ to{ opacity:1; transform:translateY(0); } }
@keyframes mfFadeUp{ to{ opacity:1; transform:translateY(0); } }
@keyframes mfCardIn{ to{ opacity:1; transform:translateY(0); } }
@keyframes mfCardRise{ to{ opacity:1; transform:translateY(0) scale(1); } }
@keyframes mfBgReveal{ to{ opacity:1; transform:scale(1); } }
@keyframes mfSpin{ to{ transform:rotate(360deg); } }

.mf-auth .mf-spin{ animation:mfSpin .8s linear infinite; }

/* =================================================================
   LOGIN VIEW
   ================================================================= */
.mf-auth.mf-login{
  background:var(--paper-2);
  height:100vh;
  overflow:hidden;
}
.mf-auth.mf-login .split{
  display:grid;
  grid-template-columns:1fr 1fr;
  height:100vh;
}

.mf-auth.mf-login .visual{
  position:relative;
  overflow:hidden;
  background-image:
    linear-gradient(115deg, rgba(4,9,7,0.86) 0%, rgba(4,9,7,0.72) 30%, rgba(4,9,7,0.42) 52%, rgba(4,9,7,0.20) 68%, rgba(4,9,7,0.55) 100%),
    linear-gradient(180deg, rgba(6,12,9,0.30) 0%, rgba(6,12,9,0.05) 30%, rgba(6,12,9,0.15) 60%, rgba(6,12,9,0.65) 100%),
    var(--mf-login-photo);
  background-position:center 30%;
  background-size:cover;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:44px 48px 40px;
}
.mf-auth.mf-login .visual .logo{
  position:absolute;
  top:44px; left:48px;
  opacity:0;
  transform:translateY(-14px);
  animation:mfFadeDown .7s cubic-bezier(.2,.8,.2,1) .1s forwards;
}
.mf-auth.mf-login .logo{
  font-family:var(--font-display); font-weight:700; font-size:20px;
  letter-spacing:-0.02em; color:#f6f5f1;
  display:flex; align-items:center; gap:9px;
  text-shadow:0 2px 10px rgba(0,0,0,0.4);
  text-decoration:none;
}
.mf-auth .logo-mark{width:27px; height:27px; flex-shrink:0;}
.mf-auth .logo-text{ display:inline-flex; }
.mf-auth .logo span.flow{color:var(--teal-bright);}

.mf-auth.mf-login .visual-copy{max-width:430px;}
.mf-auth.mf-login .visual h1{
  font-family:var(--font-display); font-weight:700;
  font-size:clamp(32px, 3.2vw, 44px);
  line-height:1.08; letter-spacing:-0.03em; color:#ffffff;
  margin-bottom:16px;
  text-shadow:0 2px 4px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.45);
  opacity:0;
  transform:translateY(22px);
  animation:mfFadeUp .8s cubic-bezier(.2,.8,.2,1) .28s forwards;
}
.mf-auth.mf-login .visual h1 .accent{color:#ff5722;}
.mf-auth.mf-login .visual .sub{
  font-size:15px; line-height:1.6; color:rgba(255,255,255,0.92); margin-bottom:32px;
  text-shadow:0 2px 10px rgba(0,0,0,0.4);
  opacity:0;
  transform:translateY(22px);
  animation:mfFadeUp .8s cubic-bezier(.2,.8,.2,1) .42s forwards;
}

.mf-auth.mf-login .feature-list{display:flex; flex-direction:column; gap:16px;}
.mf-auth.mf-login .feature-item{
  display:flex; align-items:center; gap:13px;
  opacity:0;
  transform:translateY(18px);
  animation:mfFadeUp .7s cubic-bezier(.2,.8,.2,1) forwards;
}
.mf-auth.mf-login .feature-item:nth-child(1){ animation-delay:.56s; }
.mf-auth.mf-login .feature-item:nth-child(2){ animation-delay:.68s; }
.mf-auth.mf-login .feature-item:nth-child(3){ animation-delay:.8s; }
.mf-auth.mf-login .feature-item:nth-child(4){ animation-delay:.92s; }
.mf-auth.mf-login .feature-item .ico{
  width:38px; height:38px; border-radius:11px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  backdrop-filter:blur(6px);
  box-shadow:0 4px 14px rgba(0,0,0,0.35);
}
.mf-auth.mf-login .feature-item .ico svg{width:18px; height:18px;}
.mf-auth.mf-login .feature-item:nth-child(1) .ico{ background:rgba(6,20,14,0.55); border:1px solid rgba(29,158,117,0.5); }
.mf-auth.mf-login .feature-item:nth-child(1) .ico svg{ color:#4ee8ae; }
.mf-auth.mf-login .feature-item:nth-child(2) .ico{ background:rgba(20,12,8,0.55); border:1px solid rgba(240,153,123,0.5); }
.mf-auth.mf-login .feature-item:nth-child(2) .ico svg{ color:#ffb491; }
.mf-auth.mf-login .feature-item:nth-child(3) .ico{ background:rgba(6,14,20,0.55); border:1px solid rgba(90,169,230,0.5); }
.mf-auth.mf-login .feature-item:nth-child(3) .ico svg{ color:#7ec4f5; }
.mf-auth.mf-login .feature-item:nth-child(4) .ico{ background:rgba(20,10,6,0.55); border:1px solid rgba(216,90,48,0.5); }
.mf-auth.mf-login .feature-item:nth-child(4) .ico svg{ color:var(--coral-2); }
.mf-auth.mf-login .feature-item .ftext h4{
  font-family:var(--font-display); font-size:14px; font-weight:600;
  color:#ffffff; letter-spacing:-0.01em; margin-bottom:2px;
  text-shadow:0 2px 8px rgba(0,0,0,0.45);
}
.mf-auth.mf-login .feature-item .ftext p{
  font-size:12px; color:rgba(255,255,255,0.82); line-height:1.4;
  text-shadow:0 2px 8px rgba(0,0,0,0.45);
}

.mf-auth.mf-login .form-side{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:40px;
  background:
    radial-gradient(ellipse 700px 500px at 85% -8%, rgba(216,90,48,0.08), transparent 55%),
    radial-gradient(ellipse 620px 480px at 10% 108%, rgba(29,158,117,0.10), transparent 55%),
    var(--paper-2);
}
.mf-auth.mf-login .top-actions{
  position:absolute; top:32px; right:40px;
  display:flex; gap:10px;
}
.mf-auth .btn-ghost-sm{
  font-family:var(--font-body); font-weight:600; font-size:13px;
  padding:8px 16px; border-radius:8px; cursor:pointer;
  border:1px solid var(--card-line); background:rgba(255,255,255,0.6);
  color:var(--ink); text-decoration:none; display:inline-block;
  transition:transform .25s cubic-bezier(.2,.8,.2,1), border-color .2s ease, color .2s ease, background .2s ease;
}
.mf-auth .btn-ghost-sm:hover{ border-color:var(--teal); color:var(--teal); background:rgba(29,158,117,0.08); transform:translateY(-2px); }

.mf-auth.mf-login .login-card{
  width:100%;
  max-width:400px;
  background:#ffffff;
  border:1px solid var(--card-line);
  border-radius:20px;
  padding:38px 34px 32px;
  box-shadow:0 30px 60px -30px rgba(15,26,20,0.22), 0 2px 8px rgba(15,26,20,0.04);
  opacity:0;
  transform:translateY(20px);
  animation:mfCardIn .7s cubic-bezier(.2,.8,.2,1) .1s forwards;
}
.mf-auth.mf-login .login-card h2{
  font-family:var(--font-display); font-weight:700; font-size:26px;
  letter-spacing:-0.02em; margin-bottom:6px;
}
.mf-auth.mf-login .login-card .sub{ font-size:13.5px; color:var(--muted); margin-bottom:28px; }

.mf-auth.mf-login .field{ margin-bottom:18px; }
.mf-auth .input-wrap{ position:relative; display:flex; align-items:center; }
.mf-auth .input-wrap svg.leading{
  position:absolute; left:14px; width:16px; height:16px; color:var(--placeholder); pointer-events:none;
}
.mf-auth .input-wrap input{
  width:100%;
  padding:13px 14px 13px 40px;
  border-radius:10px;
  border:1px solid rgba(15,26,20,0.16);
  background:var(--paper);
  font-family:var(--font-body);
  font-size:14.5px;
  font-weight:500;
  color:var(--ink);
  transition:border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.mf-auth .input-wrap input::placeholder{ color:var(--placeholder); font-weight:400; }
.mf-auth .input-wrap input:hover{ border-color:rgba(15,26,20,0.28); }
.mf-auth .input-wrap input:focus{
  outline:none; border-color:var(--teal); background:#ffffff;
  box-shadow:0 0 0 4px rgba(29,158,117,0.12);
}
.mf-auth .toggle-eye{
  position:absolute; right:12px; width:18px; height:18px; color:var(--placeholder);
  cursor:pointer; background:none; border:none; padding:0; display:flex; align-items:center; justify-content:center;
}
.mf-auth .toggle-eye:hover{ color:var(--teal); }
.mf-auth .toggle-eye svg{ width:18px; height:18px; }

.mf-auth .btn-submit{
  width:100%;
  font-family:var(--font-body); font-weight:600; font-size:15.5px;
  padding:14px 20px; border-radius:10px; border:none;
  background:#000000; color:#ffffff; cursor:pointer;
  box-shadow:0 16px 32px -12px rgba(0,0,0,0.45);
  transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, background .25s ease;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
}
.mf-auth .btn-submit:hover{
  transform:translateY(-2px); background:#1a1a1a;
  box-shadow:0 20px 36px -12px rgba(0,0,0,0.55);
}
.mf-auth .btn-submit:active{ transform:translateY(0); }
.mf-auth .btn-submit:disabled{ opacity:.6; cursor:not-allowed; transform:none; }

.mf-auth .divider-note{ text-align:center; font-size:13px; color:var(--muted); margin-top:22px; }
.mf-auth .divider-note button{
  color:var(--teal); font-weight:600; background:none; border:none; padding:0;
  font-family:var(--font-body); font-size:13px; cursor:pointer;
}
.mf-auth .divider-note button:hover{ text-decoration:underline; }

.mf-auth.mf-login .secure-note{
  display:flex; align-items:center; justify-content:center; gap:7px;
  margin-top:26px; font-size:12px; color:var(--muted); font-family:var(--font-mono); letter-spacing:0.03em;
}
.mf-auth.mf-login .secure-note svg{ width:14px; height:14px; color:var(--teal); }

/* =================================================================
   REGISTER VIEW
   ================================================================= */
.mf-auth.mf-register{
  min-height:100vh;
  position:relative;
  overflow-x:hidden;
}
.mf-auth.mf-register .bg-photo{
  position:fixed;
  inset:0;
  z-index:0;
  background-image:
    linear-gradient(90deg, rgba(8,12,10,0.62) 0%, rgba(8,12,10,0.30) 42%, rgba(8,12,10,0.05) 62%),
    linear-gradient(180deg, rgba(8,12,10,0.15) 0%, rgba(8,12,10,0.05) 30%, rgba(8,12,10,0.35) 100%),
    var(--mf-register-photo);
  background-size:cover;
  background-position:center;
  opacity:0;
  transform:scale(1.04);
  animation:mfBgReveal 1.1s cubic-bezier(.16,1,.3,1) forwards;
}
.mf-auth.mf-register .page{
  position:relative;
  z-index:2;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
  padding:40px 56px;
}
.mf-auth.mf-register .panel-left{
  position:relative;
  flex:1 1 auto;
  min-width:0;
  color:#f6f5f1;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-self:stretch;
  padding:8px 0 24px;
  max-width:640px;
}
.mf-auth.mf-register .logo,
.mf-auth.mf-register .panel-copy,
.mf-auth.mf-register .panel-foot{
  opacity:0;
  transform:translateY(14px);
  animation:mfFadeUp .7s cubic-bezier(.16,1,.3,1) forwards;
}
.mf-auth.mf-register .logo{ animation-delay:.15s; }
.mf-auth.mf-register .panel-copy{ animation-delay:.28s; }
.mf-auth.mf-register .panel-foot{ animation-delay:.55s; }

.mf-auth.mf-register .logo{
  font-family:var(--font-display); font-weight:700; font-size:22px;
  letter-spacing:-0.02em; color:#fff;
  display:flex; align-items:center; gap:10px;
  text-decoration:none;
}
.mf-auth.mf-register .logo-mark{
  width:34px; height:34px;
  display:flex; align-items:center; justify-content:center;
}
.mf-auth.mf-register .logo span.brand-flow{ color:var(--teal-bright); }

.mf-auth.mf-register .panel-copy{ max-width:460px; }
.mf-auth.mf-register .headline{
  font-family:var(--font-display);
  font-weight:700;
  font-size:44px;
  line-height:1.08;
  letter-spacing:-0.02em;
  margin-bottom:18px;
}
.mf-auth.mf-register .headline .accent{ color:var(--coral); }
.mf-auth.mf-register .panel-sub{
  font-size:15.5px;
  line-height:1.6;
  color:rgba(246,245,241,0.82);
  margin-bottom:38px;
  max-width:400px;
}
.mf-auth.mf-register .feature-list{ display:flex; flex-direction:column; gap:20px; }
.mf-auth.mf-register .feature{
  display:flex;
  align-items:flex-start;
  gap:14px;
  opacity:0;
  transform:translateY(10px);
  animation:mfFadeUp .6s cubic-bezier(.16,1,.3,1) forwards;
}
.mf-auth.mf-register .feature:nth-child(1){ animation-delay:.42s; }
.mf-auth.mf-register .feature:nth-child(2){ animation-delay:.50s; }
.mf-auth.mf-register .feature:nth-child(3){ animation-delay:.58s; }
.mf-auth.mf-register .feature:nth-child(4){ animation-delay:.66s; }
.mf-auth.mf-register .feature-icon{
  flex-shrink:0;
  width:38px; height:38px;
  border-radius:50%;
  background:rgba(29,158,117,0.16);
  border:1px solid rgba(29,158,117,0.35);
  display:flex; align-items:center; justify-content:center;
  color:var(--teal-bright);
}
.mf-auth.mf-register .feature-title{
  font-weight:600; font-size:14.5px; color:#fff; margin-bottom:2px;
}
.mf-auth.mf-register .feature-desc{
  font-size:13px; color:rgba(246,245,241,0.68); line-height:1.4;
}
.mf-auth.mf-register .panel-foot{
  font-family:var(--font-mono);
  font-size:11px;
  letter-spacing:0.06em;
  color:rgba(246,245,241,0.45);
}

.mf-auth.mf-register .panel-right{
  position:relative;
  flex:0 1 620px;
  max-height:calc(100vh - 80px);
  display:flex;
  align-items:stretch;
}
.mf-auth.mf-register .card{
  width:100%;
  background:#fff;
  border-radius:24px;
  box-shadow:0 40px 80px -20px rgba(5,10,8,0.45), 0 4px 16px rgba(5,10,8,0.12);
  padding:40px 44px 36px;
  overflow-y:auto;
  scrollbar-width:none;
  -ms-overflow-style:none;
  opacity:0;
  transform:translateY(26px) scale(.98);
  animation:mfCardRise .75s cubic-bezier(.16,1,.3,1) .2s forwards;
}
.mf-auth.mf-register .card::-webkit-scrollbar{ display:none; }

.mf-auth.mf-register .card-head{
  display:flex; align-items:center; gap:16px; margin-bottom:30px;
}
.mf-auth.mf-register .head-icon{
  flex-shrink:0;
  width:52px; height:52px;
  border-radius:50%;
  background:var(--teal-tint);
  color:var(--teal);
  display:flex; align-items:center; justify-content:center;
}
.mf-auth.mf-register h2{
  font-family:var(--font-display); font-weight:700;
  font-size:24px; letter-spacing:-0.02em; color:var(--ink);
  margin-bottom:4px;
}
.mf-auth.mf-register .subhead{ font-size:14px; color:var(--muted); }

.mf-auth.mf-register form{ display:flex; flex-direction:column; gap:18px; }
.mf-auth.mf-register .row{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }

.mf-auth .field-label{
  font-weight:600; font-size:13px; color:var(--ink); margin-bottom:7px; display:block;
}
.mf-auth .input-wrapper{ position:relative; }
.mf-auth .input-icon{
  position:absolute;
  left:14px; top:50%; transform:translateY(-50%);
  color:var(--muted-2);
  display:flex;
  pointer-events:none;
}
.mf-auth.mf-register input,
.mf-auth .cs-trigger{
  width:100%;
  padding:13px 14px 13px 42px;
  border-radius:9px;
  border:1px solid var(--card-line);
  background:#fbfaf8;
  font-family:var(--font-body);
  font-size:14px;
  color:var(--ink);
  transition:border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.mf-auth .select-chevron{
  position:absolute;
  right:14px; top:50%; transform:translateY(-50%);
  color:var(--muted-2);
  pointer-events:none;
  display:flex;
}
.mf-auth.mf-register input::placeholder{ color:var(--muted-2); }
.mf-auth.mf-register input:focus{
  outline:none;
  border-color:var(--teal);
  background:#fff;
  box-shadow:0 0 0 3px rgba(29,158,117,0.13);
}

/* custom dropdown */
.mf-auth .custom-select{ position:relative; }
.mf-auth .cs-trigger{
  text-align:left;
  cursor:pointer;
  display:flex;
  align-items:center;
  padding-right:38px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  user-select:none;
}
.mf-auth .cs-trigger.placeholder{ color:var(--muted-2); }
.mf-auth .cs-chevron{ transition:transform .25s cubic-bezier(.2,.8,.2,1); }
.mf-auth .custom-select.open .cs-trigger{
  border-color:var(--teal);
  background:#fff;
  box-shadow:0 0 0 3px rgba(29,158,117,0.13);
}
.mf-auth .custom-select.open .cs-chevron{ transform:translateY(-50%) rotate(180deg); }
.mf-auth .cs-panel{
  position:absolute;
  top:calc(100% + 8px);
  left:0; right:0;
  z-index:30;
  background:#fff;
  border:1px solid var(--card-line);
  border-radius:12px;
  box-shadow:0 24px 48px -14px rgba(5,10,8,0.22), 0 6px 16px rgba(5,10,8,0.08);
  padding:6px;
  max-height:0;
  opacity:0;
  overflow:hidden;
  pointer-events:none;
  transform:translateY(-6px) scale(.98);
  transform-origin:top center;
  transition:max-height .28s cubic-bezier(.2,.8,.2,1), opacity .2s ease, transform .22s cubic-bezier(.2,.8,.2,1);
}
.mf-auth .custom-select.open .cs-panel{
  max-height:280px;
  opacity:1;
  pointer-events:auto;
  transform:translateY(0) scale(1);
  overflow-y:auto;
  scrollbar-width:none;
}
.mf-auth .cs-panel::-webkit-scrollbar{ display:none; }
.mf-auth .cs-option{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  border-radius:8px;
  font-size:14px;
  color:var(--ink);
  cursor:pointer;
  transition:background .15s ease, color .15s ease;
}
.mf-auth .cs-option:hover{ background:var(--teal-tint); color:var(--teal); }
.mf-auth .cs-option.selected{ color:var(--teal); font-weight:600; background:var(--teal-tint); }
.mf-auth .cs-option .cs-check{
  display:flex;
  color:var(--teal-bright);
  opacity:0;
  transform:scale(.6);
  transition:opacity .15s ease, transform .15s ease;
}
.mf-auth .cs-option.selected .cs-check{ opacity:1; transform:scale(1); }

.mf-auth .password-wrapper input{ padding-right:44px; }
.mf-auth .eye-btn{
  position:absolute;
  right:12px;
  top:50%;
  transform:translateY(-50%);
  cursor:pointer;
  color:var(--muted-2);
  display:flex;
  background:none; border:none; padding:0;
  transition:color .2s ease;
}
.mf-auth .eye-btn:hover{ color:var(--teal); }

.mf-auth .password-hint{
  font-family:var(--font-mono);
  font-size:11.5px;
  color:var(--danger);
  margin-top:7px;
}

.mf-auth.mf-register .role-section{
  display:flex;
  flex-direction:column;
  gap:16px;
  border-top:1px dashed var(--card-line);
  margin-top:2px;
  max-height:0;
  opacity:0;
  padding-top:0;
  overflow:hidden;
  border-top-color:transparent;
  transition:max-height .45s cubic-bezier(.2,.8,.2,1), opacity .35s ease, padding-top .45s ease, border-top-color .45s ease, margin-top .45s ease;
}
.mf-auth.mf-register .role-section.expanded{
  max-height:600px;
  opacity:1;
  padding-top:18px;
  border-top-color:var(--card-line);
  overflow:visible;
}
.mf-auth.mf-register .role-section .section-title{
  display:flex;
  align-items:center;
  gap:7px;
  font-family:var(--font-mono);
  font-size:11px;
  letter-spacing:0.07em;
  text-transform:uppercase;
  color:var(--teal);
  margin-bottom:2px;
}
.mf-auth.mf-register .section-title::before{
  content:"";
  width:6px; height:6px; border-radius:50%;
  background:var(--teal-bright);
}

.mf-auth.mf-register button[type="submit"]{
  width:100%;
  font-family:var(--font-body); font-weight:600; font-size:15px;
  padding:15px 24px; border-radius:9px; border:none;
  background:var(--ink); color:#f6f5f1; cursor:pointer;
  box-shadow:0 14px 30px -10px rgba(21,26,23,0.35);
  transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, background .25s ease;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  margin-top:4px;
}
.mf-auth.mf-register button[type="submit"]::after{
  content:"\\2192";
  display:inline-block;
  transform:translateX(-4px);
  opacity:0;
  transition:transform .25s ease, opacity .25s ease;
}
.mf-auth.mf-register button[type="submit"]:hover{
  transform:translateY(-2px);
  box-shadow:0 18px 34px -12px rgba(21,26,23,0.45);
}
.mf-auth.mf-register button[type="submit"]:hover::after{ transform:translateX(0); opacity:1; }
.mf-auth.mf-register button[type="submit"]:active{ transform:translateY(0); }
.mf-auth.mf-register button[type="submit"]:disabled{ opacity:.6; cursor:not-allowed; transform:none; }

.mf-auth.mf-register .signin-note{
  text-align:center;
  margin-top:4px;
  font-size:13.5px;
  color:var(--muted);
}
.mf-auth.mf-register .signin-note button{
  color:var(--teal); font-weight:600; background:none; border:none; padding:0;
  font-family:var(--font-body); font-size:13.5px; cursor:pointer;
}
.mf-auth.mf-register .signin-note button:hover{ text-decoration:underline; }

.mf-auth.mf-register .top-link{
  position:absolute; top:24px; right:32px; z-index:3;
}

/* =================================================================
   Reduced motion + responsive
   ================================================================= */
@media (prefers-reduced-motion:reduce){
  .mf-auth, .mf-auth *{ animation:none !important; transition:none !important; }
  .mf-auth .login-card,
  .mf-auth .visual .logo,
  .mf-auth .visual h1,
  .mf-auth .visual .sub,
  .mf-auth .feature-item,
  .mf-auth .bg-photo,
  .mf-auth .logo,
  .mf-auth .panel-copy,
  .mf-auth .panel-foot,
  .mf-auth .feature,
  .mf-auth .card{ opacity:1 !important; transform:none !important; }
}

@media (max-width:900px){
  .mf-auth.mf-login{ height:auto; overflow:auto; }
  .mf-auth.mf-login .split{ grid-template-columns:1fr; height:auto; }
  .mf-auth.mf-login .visual{ min-height:420px; padding:32px 28px 30px; }
  .mf-auth.mf-login .form-side{ padding:50px 24px; }
  .mf-auth.mf-login .top-actions{ position:static; justify-content:flex-end; margin-bottom:20px; width:100%; max-width:400px; }
}
@media (max-width:980px){
  .mf-auth.mf-register .page{ flex-direction:column; align-items:stretch; padding:40px 20px; gap:28px; }
  .mf-auth.mf-register .panel-left{ max-width:none; }
  .mf-auth.mf-register .headline{ font-size:32px; }
  .mf-auth.mf-register .feature-list{ display:none; }
  .mf-auth.mf-register .panel-right{ flex:1 1 auto; max-height:none; }
  .mf-auth.mf-register .top-link{ position:static; display:flex; justify-content:flex-end; padding:16px 20px 0; }
}
@media (max-width:520px){
  .mf-auth.mf-register .row{ grid-template-columns:1fr; }
  .mf-auth.mf-register .card{ padding:28px 22px 26px; border-radius:18px; }
}
`;

/* ------------------------------------------------------------------ */
/*  Small inline icon set (matches the original SVGs)                   */
/* ------------------------------------------------------------------ */

const LogoMark = ({ size = 27 }: { size?: number }) => (
  <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 27C16 27 4 20.2 4 12.4C4 8.4 7.2 5.5 10.8 5.5C13 5.5 15 6.6 16 8.3C17 6.6 19 5.5 21.2 5.5C24.8 5.5 28 8.4 28 12.4C28 20.2 16 27 16 27Z"
      stroke="#d85a30"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M16 10.5V17.5M12.5 14H19.5" stroke="#1d9e75" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 8V12L15 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3L19 6V11C19 15.5 16 19.2 12 20.5C8 19.2 5 15.5 5 11V6L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 11.5L11.2 13.7L15 9.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MailIcon = ({ cls }: { cls?: string }) => (
  <svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const UserIcon = ({ cls, size = 16 }: { cls?: string; size?: number }) => (
  <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const LockIcon = ({ cls }: { cls?: string }) => (
  <svg className={cls} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);

const RoleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" />
  </svg>
);

const StethIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 2v6l-4 4v8a2 2 0 002 2h10a2 2 0 002-2v-8l-4-4V2M9 2h6" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21V7l9-4 9 4v14M9 21v-6h6v6" />
  </svg>
);

const BadgeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
  </svg>
);

const EyeOpen = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosed = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a18.5 18.5 0 015.06-5.94" />
    <path d="M1 1l22 22" />
  </svg>
);

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const Spinner = () => (
  <svg className="mf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.2-8.6" strokeLinecap="round" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Custom dropdown                                                     */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string };

function CustomSelect({
  value,
  options,
  placeholder,
  icon,
  onChange,
}: {
  value: string;
  options: Option[];
  placeholder: string;
  icon: ReactNode;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={ref} className={`input-wrapper custom-select${open ? " open" : ""}`}>
      <span className="input-icon">{icon}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`cs-trigger${selected ? "" : " placeholder"}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {selected ? selected.label : placeholder}
      </button>
      <span className="select-chevron cs-chevron">
        <Chevron />
      </span>
      <div className="cs-panel" role="listbox">
        {options.map((option) => (
          <div
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            className={`cs-option${option.value === value ? " selected" : ""}`}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
            <span className="cs-check">
              <Check />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const loginHighlights = [
  { icon: <ClockIcon />, title: "Real-time Queue Tracking", body: "Live updates on queue and wait times" },
  { icon: <CardIcon />, title: "Instant Token", body: "Get your digital token in seconds" },
  { icon: <TimerIcon />, title: "Save Time", body: "Plan your visit and skip the long wait" },
  { icon: <ShieldIcon />, title: "Secure & Private", body: "Your data is encrypted and protected" },
];

const registerHighlights = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M8 15h3" />
      </svg>
    ),
    title: "Instant Token",
    body: "Get your digital token in seconds.",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
    title: "Real-time Queue Updates",
    body: "Track live queue and estimated wait time.",
  },
  {
    icon: <BadgeIcon />,
    title: "Secure & Private",
    body: "Your data is encrypted and always safe.",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
    title: "Easy Appointments",
    body: "Book and manage your visits effortlessly.",
  },
];

export default function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "register" ? "signup" : "signin",
  );
  const [accountType, setAccountType] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments-public"],
    queryFn: () => departmentApi.list(),
  });

  useEffect(() => {
    if (!auth.loading && auth.userId && auth.role) {
      navigate(roleHome[auth.role]);
    }
  }, [auth.loading, auth.userId, auth.role, navigate]);

  async function handleSignIn() {
    await auth.login(email, password);
    toast.success("Welcome back to MediFlow.");
  }

  async function handleSignUp() {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const status = await auth.register({
      name,
      email,
      password,
      role: accountType,
      specialization:
        accountType === "DOCTOR" ? specialization || "General Practitioner" : undefined,
      departmentId: accountType === "DOCTOR" ? departmentId || null : undefined,
      licenseNumber: accountType === "DOCTOR" ? licenseNumber : undefined,
    });

    if (status === "PENDING_APPROVAL") {
      toast.success("Doctor request submitted. You can sign in once an administrator approves it.");
    } else {
      toast.success("Account created. You can sign in now.");
    }
    setMode("signin");
    setConfirmPassword("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") await handleSignUp();
      else await handleSignIn();
    } catch (error) {
      const message =
        // @ts-expect-error axios error shape
        error?.response?.data?.detail ??
        (error instanceof Error ? error.message : "Authentication failed.");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const passwordTooShort = password.length > 0 && password.length < 8;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const departmentOptions: Option[] = (departments ?? []).map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  /* ------------------------------ LOGIN ------------------------------ */
  if (mode === "signin") {
    return (
      <div
        className="mf-auth mf-login"
        style={{ ["--mf-login-photo" as string]: `url(${authHero})` } as React.CSSProperties}
      >
        <style>{styles}</style>

        <div className="split">
          <div className="visual">
            <Link to="/" className="logo">
              <LogoMark />
              <span className="logo-text">
                <span>Medi</span>
                <span className="flow">Flow</span>
              </span>
            </Link>

            <div className="visual-copy">
              <h1>
                Smarter queue.
                <br />
                Better <span className="accent">care.</span>
              </h1>
              <p className="sub">
                MediFlow helps you manage your wait
                <br />
                and your time, so you can focus on
                <br />
                what matters most — your health.
              </p>

              <div className="feature-list">
                {loginHighlights.map((item) => (
                  <div className="feature-item" key={item.title}>
                    <div className="ico">{item.icon}</div>
                    <div className="ftext">
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-side">
            <div className="top-actions">
              <Link to="/" className="btn-ghost-sm">
                ← Back
              </Link>
            </div>

            <div className="login-card">
              <h2>Welcome back</h2>
              <p className="sub">Log in to your MediFlow account</p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <div className="input-wrap">
                    <MailIcon cls="leading" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="field">
                  <div className="input-wrap">
                    <LockIcon cls="leading" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="toggle-eye"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-submit" disabled={busy}>
                  {busy && <Spinner />}
                  Login
                </button>
              </form>

              <p className="divider-note">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setMode("signup")}>
                  Register here
                </button>
              </p>
            </div>

            <div className="secure-note">
              <ShieldIcon />
              Your data is safe and encrypted
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------- REGISTER ---------------------------- */
  return (
    <div
      className="mf-auth mf-register"
      style={{ ["--mf-register-photo" as string]: `url(${registerHero})` } as React.CSSProperties}
    >
      <style>{styles}</style>

      <div className="bg-photo" />

      {/* <div className="top-link">
        <Link to="/" className="btn-ghost-sm">
          ← Back
        </Link>
      </div> */}

      <div className="page">
        <div className="panel-left">
          <Link to="/" className="logo">
            <span className="logo-mark">
              <LogoMark size={30} />
            </span>
            <span>
              Medi<span className="brand-flow">Flow</span>
            </span>
          </Link>

          <div className="panel-copy">
            <div className="headline">
              Join MediFlow
              <br />
              Better care,
              <br />
              <span className="accent">less wait.</span>
            </div>
            <p className="panel-sub">
              Create your account to book appointments, generate tokens, and track real-time queue
              wait times.
            </p>

            <div className="feature-list">
              {registerHighlights.map((item) => (
                <div className="feature" key={item.title}>
                  <span className="feature-icon">{item.icon}</span>
                  <div>
                    <div className="feature-title">{item.title}</div>
                    <div className="feature-desc">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-foot">MEDIFLOW — CLINIC QUEUE &amp; TOKEN SYSTEM</div>
        </div>

        <div className="panel-right">
          <div className="card">
            <div className="card-head">
              <span className="head-icon">
                <UserIcon size={24} />
              </span>
              <div>
                <h2>Create Your Account</h2>
                <p className="subhead">Fill in the details below to get started.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <UserIcon />
                    </span>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <MailIcon />
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="input-wrapper password-wrapper">
                    <span className="input-icon">
                      <LockIcon />
                    </span>
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeClosed size={17} /> : <EyeOpen size={17} />}
                    </button>
                  </div>
                  {passwordTooShort && (
                    <div className="password-hint">Password must contain minimum 8 characters</div>
                  )}
                </div>

                <div className="field">
                  <label className="field-label">Confirm Password</label>
                  <div className="input-wrapper password-wrapper">
                    <span className="input-icon">
                      <LockIcon />
                    </span>
                    <input
                      required
                      minLength={8}
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirm((prev) => !prev)}
                    >
                      {showConfirm ? <EyeClosed size={17} /> : <EyeOpen size={17} />}
                    </button>
                  </div>
                  {confirmMismatch && <div className="password-hint">Passwords do not match</div>}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Select Role</label>
                <CustomSelect
                  value={accountType}
                  placeholder="Choose your role"
                  icon={<RoleIcon />}
                  options={[
                    { value: "PATIENT", label: "Patient" },
                    { value: "DOCTOR", label: "Doctor (needs admin approval)" },
                  ]}
                  onChange={(value) => setAccountType(value as "PATIENT" | "DOCTOR")}
                />
              </div>

              <div className={`role-section${accountType === "DOCTOR" ? " expanded" : ""}`}>
                <span className="section-title">Doctor verification details</span>

                <div className="field">
                  <label className="field-label">Specialization</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <StethIcon />
                    </span>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiology"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="field">
                    <label className="field-label">Department</label>
                    <CustomSelect
                      value={departmentId}
                      placeholder="Select department"
                      icon={<BuildingIcon />}
                      options={departmentOptions}
                      onChange={setDepartmentId}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">License Number</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <BadgeIcon />
                      </span>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. TN-MC-238491"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={busy}>
                {busy && <Spinner />}
                {accountType === "DOCTOR" ? "Submit doctor request" : "Create Account"}
              </button>

              <p className="signin-note">
                Already registered?{" "}
                <button type="button" onClick={() => setMode("signin")}>
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}