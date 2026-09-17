import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import landingHero from "@/assets/mediflow-home.png";

const GAUGE_CIRC = 135;
const START_SECONDS = 11 * 60 + 24;
const RESET_SECONDS = 15 * 60 + 40;

const styles = `
.mf-landing{
  --paper:#f6f5f1;
  --paper-2:#efeee8;
  --ink:#151a17;
  --muted:#5c655f;
  --muted-2:#8b9289;
  --teal:#0f6e56;
  --teal-bright:#1d9e75;
  --teal-pale:#eafbf3;
  --coral:#d85a30;
  --coral-2:#f0997b;
  --line:rgba(15,26,20,0.08);
  --card-line:rgba(15,26,20,0.09);
  --font-display:'Space Grotesk', sans-serif;
  --font-body:'Inter', sans-serif;
  --font-mono:'JetBrains Mono', monospace;

  font-family:var(--font-body);
  background:var(--paper);
  color:var(--ink);
  overflow:hidden;
  height:100vh;
  display:flex;
  flex-direction:column;
}
.mf-landing *{margin:0;padding:0;box-sizing:border-box;}

@keyframes mfFadeDown{ to{ opacity:1; transform:translateY(0); } }
@keyframes mfFadeUp{ to{ opacity:1; transform:translateY(0); } }
@keyframes mfScaleIn{ to{ opacity:1; transform:scale(1) translateY(0); } }
@keyframes mfPulseDot{0%,100%{opacity:1; transform:scale(1)} 50%{opacity:0.4; transform:scale(0.75)}}
@keyframes mfDrawLine{ to{ stroke-dashoffset:0; } }

/* ---------------- HERO with photo background ---------------- */
.mf-landing .hero-section{
  position:relative;
  flex:1 1 auto;
  min-height:0;
  display:flex;
  flex-direction:column;
  background-image:
    linear-gradient(0deg, rgba(6,12,10,0.92) 0%, rgba(6,12,10,0.6) 10%, rgba(6,12,10,0.0) 26%),
    linear-gradient(115deg, rgba(9,17,14,0.28) 0%, rgba(10,22,18,0.16) 40%, rgba(10,22,18,0.08) 62%, rgba(10,22,18,0.03) 100%),
    linear-gradient(0deg, rgba(6,12,10,0.14) 0%, rgba(6,12,10,0.0) 30%),
    var(--mf-hero);
  background-position:center 30%;
  background-size:cover;
  border-radius:0 0 32px 32px;
  overflow:hidden;
  margin:0 0 26px 0;
}

.mf-landing nav{
  position:relative; z-index:3;
  flex:0 0 auto;
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px 10px 20px;
  max-width:1240px; margin:20px auto 0;
  width:calc(100% - 100px);
  background:rgba(9,16,14,0.55);
  backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,0.10);
  border-radius:100px;
  box-shadow:0 10px 26px -12px rgba(0,0,0,0.4);
  opacity:0;
  transform:translateY(-16px);
  animation:mfFadeDown .7s cubic-bezier(.2,.8,.2,1) .1s forwards;
}
.mf-landing .logo{
  font-family:var(--font-display); font-weight:700; font-size:18px;
  letter-spacing:-0.02em; color:#f6f5f1;
  display:flex; align-items:center; gap:8px;
}
.mf-landing .logo-mark{width:24px; height:24px; flex-shrink:0;}
.mf-landing .logo-text{ display:inline-flex; }
.mf-landing .logo span.flow{color:var(--teal-bright);}

.mf-landing .nav-actions{display:flex; gap:10px;}
.mf-landing .btn{font-family:var(--font-body); font-weight:600; font-size:13px; padding:8px 16px; border-radius:8px; cursor:pointer; transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .25s ease, background .25s ease, color .25s ease; border:1px solid transparent; text-decoration:none; display:inline-block;}
.mf-landing .btn-ghost{background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.35); color:#f6f5f1;}
.mf-landing .btn-ghost:hover{ border-color:#fff; background:rgba(255,255,255,0.14); transform:translateY(-2px); }
.mf-landing .btn-teal{background:var(--teal-bright); color:#08160f;}
.mf-landing .btn-teal:hover{ background:#22b483; transform:translateY(-2px); box-shadow:0 14px 26px -12px rgba(29,158,117,0.55); }
.mf-landing .btn:active{ transform:translateY(0); }

.mf-landing .hero{
  position:relative; z-index:2;
  flex:1 1 auto;
  min-height:0;
  max-width:1240px; margin:0 auto;
  padding:10px 40px 20px;
  width:100%;
  display:grid;
  grid-template-columns:1.3fr 0.7fr;
  gap:36px;
  align-items:center;
}

.mf-landing .eyebrow{
  display:inline-flex; align-items:center; gap:8px;
  font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.12em;
  color:#eafbf3; background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.28);
  padding:6px 13px; border-radius:100px; margin-bottom:16px;
  backdrop-filter:blur(6px);
  opacity:0;
  transform:translateY(18px);
  animation:mfFadeUp .7s cubic-bezier(.2,.8,.2,1) .3s forwards;
}
.mf-landing .eyebrow .dot{width:5px; height:5px; border-radius:50%; background:var(--teal-bright); animation:mfPulseDot 1.8s ease-in-out infinite 1.4s;}

.mf-landing h1{
  font-family:var(--font-display); font-weight:700;
  font-size:clamp(32px, 3.6vw, 50px);
  line-height:1.08; letter-spacing:-0.03em; color:#f8f7f3;
  margin-bottom:16px;
  text-shadow:0 4px 30px rgba(0,0,0,0.25);
  opacity:0;
  transform:translateY(24px);
  animation:mfFadeUp .8s cubic-bezier(.2,.8,.2,1) .42s forwards;
}
.mf-landing h1 .accent{color:#ff5722;}
.mf-landing .subhead{
  font-size:16px; line-height:1.6; color:rgba(246,245,241,0.85); max-width:490px; margin-bottom:24px;
  opacity:0;
  transform:translateY(20px);
  animation:mfFadeUp .8s cubic-bezier(.2,.8,.2,1) .56s forwards;
}

.mf-landing .cta-row{
  display:flex; align-items:center; gap:14px; flex-wrap:wrap;
  opacity:0;
  transform:translateY(18px);
  animation:mfFadeUp .7s cubic-bezier(.2,.8,.2,1) .7s forwards;
}
.mf-landing .btn-primary{
  font-family:var(--font-body); font-weight:600; font-size:15px;
  padding:13px 24px; border-radius:9px; border:none;
  background:var(--teal-bright); color:#08160f; cursor:pointer;
  box-shadow:0 16px 32px -12px rgba(29,158,117,0.5);
  transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, background .25s ease;
  display:inline-flex; align-items:center; gap:8px;
  text-decoration:none;
}
.mf-landing .btn-primary svg{width:17px; height:17px;}
.mf-landing .btn-primary:hover{ transform:translateY(-2px); background:#22b483; box-shadow:0 20px 36px -12px rgba(29,158,117,0.6); }
.mf-landing .btn-primary:active{ transform:translateY(0); }
.mf-landing .cta-note{font-size:13.5px; color:rgba(246,245,241,0.75); display:inline-flex; align-items:center; gap:6px;}
.mf-landing .cta-note svg{width:14px; height:14px; opacity:0.75;}

/* ---------------- queue preview card ---------------- */
.mf-landing .queue-card{
  background:rgba(246,245,241,0.95);
  backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,0.5);
  border-radius:18px;
  padding:20px 20px 18px;
  box-shadow:0 24px 48px -22px rgba(6,12,10,0.55), 0 2px 10px rgba(6,12,10,0.08);
  width:100%;
  max-width:420px;
  margin:0 0 0 auto;
  align-self:center;
  opacity:0;
  transform:scale(0.94) translateY(16px);
  animation:mfScaleIn .75s cubic-bezier(.2,.8,.2,1) .5s forwards;
}
.mf-landing .queue-top-label{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.09em; color:var(--teal);
  background:var(--teal-pale); border:1px solid rgba(15,110,86,0.18);
  padding:5px 12px; border-radius:100px; margin-bottom:14px;
}
.mf-landing .queue-top-label .dot{width:4px; height:4px; border-radius:50%; background:var(--teal-bright);}

.mf-landing .queue-body{
  display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px;
}
.mf-landing .queue-copy{flex:1; min-width:0;}
.mf-landing .queue-copy .icon-badge{
  width:32px; height:32px; border-radius:9px; background:var(--teal-pale);
  display:flex; align-items:center; justify-content:center; margin-bottom:9px;
}
.mf-landing .queue-copy .icon-badge svg{width:16px; height:16px; color:var(--teal);}
.mf-landing .queue-copy h3{font-family:var(--font-display); font-size:15px; font-weight:600; letter-spacing:-0.01em; margin-bottom:6px; line-height:1.25;}
.mf-landing .queue-copy p{font-size:12.5px; line-height:1.5; color:var(--muted);}

/* phone mockup on pedestal */
.mf-landing .phone-stage{
  flex-shrink:0;
  width:130px; height:154px;
  position:relative;
  display:flex; align-items:flex-end; justify-content:center;
}
.mf-landing .phone-pedestal{
  position:absolute;
  bottom:0; left:50%; transform:translateX(-50%);
  width:118px; height:40px;
  background:radial-gradient(50% 50% at 50% 40%, #f2f1ec 0%, #e4e2da 100%);
  border-radius:50%;
  box-shadow:0 10px 16px -8px rgba(6,12,10,0.25);
}
.mf-landing .phone{
  width:78px; height:156px; flex-shrink:0;
  background:#12171a;
  border-radius:16px;
  padding:4px;
  box-shadow:0 14px 22px -10px rgba(6,12,10,0.4);
  position:relative;
  transform:rotate(-4deg) translateY(-6px);
  z-index:1;
}
.mf-landing .phone::before{
  content:"";
  position:absolute; top:5px; left:50%; transform:translateX(-50%);
  width:26px; height:3.5px; border-radius:4px; background:#2a3330; z-index:2;
}
.mf-landing .phone-screen{
  width:100%; height:100%;
  background:linear-gradient(180deg, #ffffff 0%, #f4faf7 100%);
  border-radius:12px;
  padding:12px 8px 8px;
  display:flex; flex-direction:column; align-items:center;
  position:relative; overflow:hidden;
}
.mf-landing .phone-screen .plabel{font-family:var(--font-mono); font-size:6.5px; letter-spacing:0.08em; color:var(--muted-2); margin-bottom:8px;}
.mf-landing .gauge-wrap{position:relative; width:54px; height:54px; margin-bottom:6px;}
.mf-landing .gauge-wrap svg{transform:rotate(-90deg); width:54px; height:54px;}
.mf-landing .gauge-track{fill:none; stroke:rgba(15,26,20,0.08); stroke-width:6;}
.mf-landing .gauge-fill{fill:none; stroke:var(--teal-bright); stroke-width:6; stroke-linecap:round; stroke-dasharray:135; transition:stroke-dashoffset 1s linear;}
.mf-landing .gauge-center{position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;}
.mf-landing .gauge-center .t{font-family:var(--font-mono); font-size:10.5px; font-weight:500; color:var(--ink);}
.mf-landing .gauge-center .l{font-family:var(--font-body); font-size:5.5px; color:var(--muted-2); letter-spacing:0.03em;}
.mf-landing .phone-trend{width:100%; margin-top:2px;}
.mf-landing .phone-trend .tlabel{font-family:var(--font-mono); font-size:5.5px; color:var(--muted-2); margin-bottom:2px; letter-spacing:0.05em;}
.mf-landing .phone-trend svg path{
  stroke-dasharray:220;
  stroke-dashoffset:220;
  animation:mfDrawLine 1.1s ease-out 1.05s forwards;
}

.mf-landing .stat-row{display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding-top:14px; border-top:1px dashed var(--card-line);}
.mf-landing .stat{
  background:rgba(15,26,20,0.03); border-radius:10px; padding:9px 8px; display:flex; align-items:center; gap:7px;
  opacity:0;
  transform:translateY(10px);
  animation:mfFadeUp .5s cubic-bezier(.2,.8,.2,1) forwards;
}
.mf-landing .stat:nth-child(1){ animation-delay:.95s; }
.mf-landing .stat:nth-child(2){ animation-delay:1.05s; }
.mf-landing .stat:nth-child(3){ animation-delay:1.15s; }
.mf-landing .stat .stat-icon{width:26px; height:26px; border-radius:8px; background:var(--teal-pale); display:flex; align-items:center; justify-content:center; flex-shrink:0;}
.mf-landing .stat .stat-icon svg{width:13px; height:13px; color:var(--teal);}
.mf-landing .stat .stat-text{display:flex; flex-direction:column; min-width:0;}
.mf-landing .stat .stat-label{font-size:9.5px; color:var(--muted-2); margin-bottom:2px; white-space:nowrap;}
.mf-landing .stat .stat-value{font-family:var(--font-mono); font-size:14.5px; font-weight:600; color:var(--ink); line-height:1.1;}
.mf-landing .stat .stat-sub{font-size:8.5px; color:var(--muted-2); margin-top:1px;}

/* ---------------- feature strip ---------------- */
.mf-landing .features-wrap{
  max-width:1240px; margin:0 auto;
  padding:0 40px;
  position:relative; z-index:2;
  flex:0 0 auto;
  width:100%;
  transform:translateY(-16px);
}
.mf-landing .features{
  background:#ffffff;
  border:1px solid var(--card-line);
  border-radius:16px;
  padding:20px 22px;
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:20px;
  box-shadow:0 24px 48px -28px rgba(15,26,20,0.18);
}
.mf-landing .feature{
  display:flex; flex-direction:column; gap:7px;
  opacity:0;
  transform:translateY(16px);
  animation:mfFadeUp .6s cubic-bezier(.2,.8,.2,1) forwards;
}
.mf-landing .feature:nth-child(1){ animation-delay:1.2s; }
.mf-landing .feature:nth-child(2){ animation-delay:1.3s; }
.mf-landing .feature:nth-child(3){ animation-delay:1.4s; }
.mf-landing .feature:nth-child(4){ animation-delay:1.5s; }
.mf-landing .feature .ficon{width:32px; height:32px; border-radius:9px; background:var(--teal-pale); display:flex; align-items:center; justify-content:center;}
.mf-landing .feature .ficon svg{width:16px; height:16px; color:var(--teal);}
.mf-landing .feature h4{font-family:var(--font-display); font-size:13px; font-weight:600; letter-spacing:-0.01em;}
.mf-landing .feature p{font-size:11px; line-height:1.45; color:var(--muted);}
.mf-landing .feature + .feature{border-left:1px solid var(--card-line); padding-left:20px;}

@media (prefers-reduced-motion:reduce){
  .mf-landing, .mf-landing *{ animation:none !important; transition:none !important; }
  .mf-landing nav,
  .mf-landing .eyebrow,
  .mf-landing h1,
  .mf-landing .subhead,
  .mf-landing .cta-row,
  .mf-landing .queue-card,
  .mf-landing .stat,
  .mf-landing .feature{ opacity:1; transform:none; }
  .mf-landing .phone-trend svg path{ stroke-dashoffset:0; }
}

@media (max-width:980px){
  .mf-landing{overflow-y:auto; height:auto; min-height:100vh;}
  .mf-landing .hero{grid-template-columns:1fr; padding:20px 20px 30px;}
  .mf-landing nav{padding:14px 18px;}
  .mf-landing .hero-section{min-height:auto;}
  .mf-landing .features{grid-template-columns:repeat(2,1fr);}
  .mf-landing .feature:nth-child(3){border-left:1px solid var(--card-line);}
  .mf-landing .feature:nth-child(odd){border-left:none; padding-left:0;}
  .mf-landing .features-wrap{padding:0 16px; transform:none; margin-top:20px;}
  .mf-landing .queue-card{max-width:460px; margin:0 auto;}
  .mf-landing .queue-body{flex-direction:column;}
  .mf-landing .phone{margin:0 auto;}
}
`;

export default function Landing() {
  const [totalSeconds, setTotalSeconds] = useState(START_SECONDS);
  // the gauge stays empty until the queue card has scaled into view
  const [gaugeReady, setGaugeReady] = useState(false);

  useEffect(() => {
    const reveal = window.setTimeout(() => setGaugeReady(true), 950);
    const timer = window.setInterval(() => {
      setTotalSeconds((prev) => (prev <= 1 ? RESET_SECONDS : prev - 1));
    }, 1000);

    return () => {
      window.clearTimeout(reveal);
      window.clearInterval(timer);
    };
  }, []);

  const minutes = Math.floor(totalSeconds / 60).toString();
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  // gauge reflects progress toward a ~16 min max window
  const pct = Math.max(0, Math.min(1, totalSeconds / (16 * 60)));
  const dashOffset = gaugeReady ? GAUGE_CIRC - GAUGE_CIRC * pct : GAUGE_CIRC;

  return (
    <div
      className="mf-landing"
      style={{ "--mf-hero": `url(${landingHero})` } as CSSProperties}
    >
      <style>{styles}</style>

      <section className="hero-section">
        <nav>
          <div className="logo">
            <svg className="logo-mark" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 27C16 27 4 20.2 4 12.4C4 8.4 7.2 5.5 10.8 5.5C13 5.5 15 6.6 16 8.3C17 6.6 19 5.5 21.2 5.5C24.8 5.5 28 8.4 28 12.4C28 20.2 16 27 16 27Z"
                stroke="#d85a30"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M16 10.5V17.5M12.5 14H19.5" stroke="#1d9e75" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
            <span className="logo-text">
              <span className="medi">Medi</span>
              <span className="flow">Flow</span>
            </span>
          </div>
          <div className="nav-actions">
            <Link to="/auth" className="btn btn-ghost">
              Login
            </Link>
            <Link to="/auth?mode=register" className="btn btn-teal">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="hero">
          <div>
            <div className="eyebrow">
              <span className="dot" /> REAL-TIME QUEUE INSIGHTS
            </div>
            <h1>
              Know your wait
              <br />
              before you <span className="accent">arrive.</span>
            </h1>
            <p className="subhead">
              MediFlow gives you a digital token and predicts your consultation time using live
              queue data — so you spend less time waiting and more time where you want to be.
            </p>
            <div className="cta-row">
              <Link to="/auth?mode=register" className="btn-primary">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Book an Appointment
              </Link>
              <span className="cta-note">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3L20 6.5V11.5C20 16.5 16.5 20.7 12 22C7.5 20.7 4 16.5 4 11.5V6.5L12 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 12L11.2 14.2L15.5 9.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                No app install required
              </span>
            </div>
          </div>

          <div className="queue-card">
            <div className="queue-top-label">
              <span className="dot" /> LIVE QUEUE PREVIEW
            </div>

            <div className="queue-body">
              <div className="queue-copy">
                <div className="icon-badge">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <h3>Real-time Queue Insights</h3>
                <p>Live tracking of the queue and an estimated wait based on real patient flow.</p>
              </div>

              <div className="phone-stage">
                <div className="phone-pedestal" />
                <div className="phone">
                  <div className="phone-screen">
                    <div className="plabel">LIVE QUEUE</div>
                    <div className="gauge-wrap">
                      <svg viewBox="0 0 44 44">
                        <circle className="gauge-track" cx="22" cy="22" r="17.5" />
                        <circle
                          className="gauge-fill"
                          cx="22"
                          cy="22"
                          r="17.5"
                          style={{ strokeDashoffset: dashOffset }}
                        />
                      </svg>
                      <div className="gauge-center">
                        <span className="t">
                          {minutes}:{seconds}
                        </span>
                        <span className="l">min left</span>
                      </div>
                    </div>
                    <div className="phone-trend">
                      <div className="tlabel">LIVE TREND</div>
                      <svg viewBox="0 0 100 26" preserveAspectRatio="none" width="100%" height="16">
                        <path
                          d="M0,18 L14,18 L18,4 L22,24 L27,8 L32,20 L37,18 L48,18 L52,12 L56,21 L61,18 L100,18"
                          stroke="#1d9e75"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-row">
              <div className="stat">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M2 20C2 16.5 4.7 14 8 14C9.5 14 10.8 14.5 11.8 15.4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12.5 15.5C13.5 14.6 14.9 14 16.5 14C19.8 14 22 16.5 22 20"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="stat-text">
                  <div className="stat-label">Your Token</div>
                  <div className="stat-value">84</div>
                  <div className="stat-sub">Generated</div>
                </div>
              </div>
              <div className="stat">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 9V13L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M9.5 3H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="stat-text">
                  <div className="stat-label">Est. Time</div>
                  <div className="stat-value">
                    {minutes}:{seconds}
                  </div>
                  <div className="stat-sub">min left</div>
                </div>
              </div>
              <div className="stat">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3 11H21" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="stat-text">
                  <div className="stat-label">People Ahead</div>
                  <div className="stat-value">3</div>
                  <div className="stat-sub">ahead of you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="features-wrap">
        <div className="features">
          <div className="feature">
            <div className="ficon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h4>Real-time Updates</h4>
            <p>Live queue tracking for accurate wait times, refreshed as patients are seen.</p>
          </div>
          <div className="feature">
            <div className="ficon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 10H20" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <h4>Instant Token</h4>
            <p>Get your digital token immediately when you book — no counters, no paper slips.</p>
          </div>
          <div className="feature">
            <div className="ficon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 3L4 14H11L10 21L20 9H13L13 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h4>Save Time</h4>
            <p>Skip the long wait in the lobby and plan the rest of your day with confidence.</p>
          </div>
          <div className="feature">
            <div className="ficon">
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
            </div>
            <h4>Secure &amp; Private</h4>
            <p>Your health and appointment data stay encrypted and visible only to you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}