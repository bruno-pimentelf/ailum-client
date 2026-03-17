"use client"

// Static CSS-only background — zero JS, zero canvas, zero rAF loop.
// All animations run on the browser compositor thread (GPU), off main thread.
export function ParticlesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>

      {/* ══ LARGE ORBS — slow drift, define page atmosphere ══════════════════ */}

      {/* Hero — dominant accent bloom, top-left */}
      <div className="absolute rounded-full" style={{
        width: 1100, height: 1100,
        top: "-30%", left: "-15%",
        background: "radial-gradient(circle, rgba(0,181,212,0.10) 0%, rgba(0,181,212,0.03) 40%, transparent 70%)",
        animation: "orb-drift-a 22s ease-in-out infinite",
      }} />

      {/* Hero — warm cyan accent, top-right */}
      <div className="absolute rounded-full" style={{
        width: 800, height: 800,
        top: "-10%", right: "-12%",
        background: "radial-gradient(circle, rgba(0,181,212,0.08) 0%, rgba(0,200,220,0.02) 45%, transparent 70%)",
        animation: "orb-drift-b 26s ease-in-out infinite",
        animationDelay: "-6s",
      }} />

      {/* Mid-page — deep teal, center */}
      <div className="absolute rounded-full" style={{
        width: 900, height: 900,
        top: "30%", left: "25%",
        background: "radial-gradient(circle, rgba(0,181,212,0.055) 0%, transparent 65%)",
        animation: "orb-drift-c 30s ease-in-out infinite",
        animationDelay: "-10s",
      }} />

      {/* Mid-page — right side accent */}
      <div className="absolute rounded-full" style={{
        width: 650, height: 650,
        top: "45%", right: "-8%",
        background: "radial-gradient(circle, rgba(0,181,212,0.07) 0%, rgba(0,150,180,0.02) 50%, transparent 70%)",
        animation: "orb-drift-a 24s ease-in-out infinite reverse",
        animationDelay: "-14s",
      }} />

      {/* Lower-mid — left bleed */}
      <div className="absolute rounded-full" style={{
        width: 750, height: 750,
        top: "62%", left: "-10%",
        background: "radial-gradient(circle, rgba(0,181,212,0.06) 0%, transparent 65%)",
        animation: "orb-drift-b 28s ease-in-out infinite reverse",
        animationDelay: "-4s",
      }} />

      {/* Footer bloom */}
      <div className="absolute rounded-full" style={{
        width: 1000, height: 1000,
        bottom: "-25%", left: "15%",
        background: "radial-gradient(circle, rgba(0,181,212,0.07) 0%, rgba(0,181,212,0.02) 40%, transparent 70%)",
        animation: "orb-drift-c 20s ease-in-out infinite",
        animationDelay: "-8s",
      }} />

      {/* ══ MEDIUM ORBS — secondary rhythm ═══════════════════════════════════ */}

      {/* Top-center — subtle fill */}
      <div className="absolute rounded-full" style={{
        width: 500, height: 500,
        top: "5%", left: "40%",
        background: "radial-gradient(circle, rgba(0,181,212,0.04) 0%, transparent 70%)",
        animation: "orb-drift-a 18s ease-in-out infinite",
        animationDelay: "-3s",
      }} />

      {/* Mid-right secondary */}
      <div className="absolute rounded-full" style={{
        width: 420, height: 420,
        top: "70%", right: "20%",
        background: "radial-gradient(circle, rgba(0,181,212,0.05) 0%, transparent 65%)",
        animation: "orb-drift-b 16s ease-in-out infinite",
        animationDelay: "-11s",
      }} />

      {/* ══ ACCENT RINGS — thin glowing halos ════════════════════════════════ */}

      {/* Ring 1 — hero area */}
      <div className="absolute rounded-full" style={{
        width: 600, height: 600,
        top: "2%", left: "5%",
        border: "1px solid rgba(0,181,212,0.06)",
        boxShadow: "inset 0 0 60px rgba(0,181,212,0.03), 0 0 60px rgba(0,181,212,0.03)",
        animation: "ring-breathe 14s ease-in-out infinite",
      }} />

      {/* Ring 2 — mid page */}
      <div className="absolute rounded-full" style={{
        width: 440, height: 440,
        top: "48%", right: "8%",
        border: "1px solid rgba(0,181,212,0.05)",
        boxShadow: "inset 0 0 40px rgba(0,181,212,0.025)",
        animation: "ring-breathe 18s ease-in-out infinite",
        animationDelay: "-7s",
      }} />

      {/* Ring 3 — bottom */}
      <div className="absolute rounded-full" style={{
        width: 520, height: 520,
        bottom: "5%", left: "35%",
        border: "1px solid rgba(0,181,212,0.04)",
        animation: "ring-breathe 22s ease-in-out infinite",
        animationDelay: "-13s",
      }} />

      {/* ══ SHARP ACCENT DOTS — scattered sparkles ════════════════════════════ */}
      {[
        { top: "6%",   left: "18%",  size: 2.5, alpha: 0.5,  delay: "0s",     dur: "5s"   },
        { top: "11%",  left: "58%",  size: 2,   alpha: 0.4,  delay: "-1.5s",  dur: "7s"   },
        { top: "9%",   left: "82%",  size: 1.5, alpha: 0.35, delay: "-3s",    dur: "6s"   },
        { top: "22%",  left: "35%",  size: 2,   alpha: 0.3,  delay: "-2s",    dur: "8s"   },
        { top: "28%",  left: "72%",  size: 2.5, alpha: 0.45, delay: "-4.5s",  dur: "5.5s" },
        { top: "38%",  left: "8%",   size: 2,   alpha: 0.35, delay: "-0.5s",  dur: "9s"   },
        { top: "42%",  left: "50%",  size: 1.5, alpha: 0.25, delay: "-6s",    dur: "7.5s" },
        { top: "52%",  left: "88%",  size: 2,   alpha: 0.4,  delay: "-2.5s",  dur: "6.5s" },
        { top: "58%",  left: "25%",  size: 2.5, alpha: 0.45, delay: "-8s",    dur: "5s"   },
        { top: "65%",  left: "62%",  size: 2,   alpha: 0.3,  delay: "-1s",    dur: "8.5s" },
        { top: "74%",  left: "15%",  size: 1.5, alpha: 0.35, delay: "-5s",    dur: "7s"   },
        { top: "78%",  left: "78%",  size: 2,   alpha: 0.4,  delay: "-3.5s",  dur: "6s"   },
        { top: "88%",  left: "42%",  size: 2.5, alpha: 0.45, delay: "-7s",    dur: "5.5s" },
        { top: "92%",  left: "68%",  size: 1.5, alpha: 0.3,  delay: "-9s",    dur: "9s"   },
        { top: "16%",  left: "92%",  size: 2,   alpha: 0.35, delay: "-4s",    dur: "7.5s" },
      ].map((dot, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width:  dot.size,
          height: dot.size,
          top:    dot.top,
          left:   dot.left,
          background: `rgba(0,181,212,${dot.alpha})`,
          boxShadow:  `0 0 ${dot.size * 4}px ${dot.size * 1.5}px rgba(0,181,212,${dot.alpha * 0.45})`,
          animation:  `dot-pulse ${dot.dur} ease-in-out infinite`,
          animationDelay: dot.delay,
        }} />
      ))}

      <style jsx>{`
        @keyframes orb-drift-a {
          0%, 100% { transform: translate(0px,   0px)   scale(1);    }
          33%       { transform: translate(40px,  -28px) scale(1.05); }
          66%       { transform: translate(-28px,  32px) scale(0.96); }
        }
        @keyframes orb-drift-b {
          0%, 100% { transform: translate(0px,   0px)   scale(1);    }
          40%       { transform: translate(-35px,  28px) scale(1.04); }
          70%       { transform: translate(28px,  -22px) scale(0.97); }
        }
        @keyframes orb-drift-c {
          0%, 100% { transform: translate(0px,   0px)   scale(1);    }
          25%       { transform: translate(20px,  35px)  scale(1.03); }
          55%       { transform: translate(-30px, -20px) scale(0.98); }
          80%       { transform: translate(15px,  10px)  scale(1.02); }
        }
        @keyframes ring-breathe {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.06); opacity: 0.4; }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1;    transform: scale(1);   }
          50%       { opacity: 0.15; transform: scale(0.5); }
        }
      `}</style>
    </div>
  )
}
