import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  const [hovPrimary, setHovPrimary] = useState(false);
  const [hovSecondary, setHovSecondary] = useState(false);

  return (
    <section id="hero" style={{ position:'relative', minHeight:'100vh', overflow:'hidden', fontFamily:"'Poppins',sans-serif" }}>
      {/* Subtle gradient background instead of Spline */}
      <div style={{
        position:'absolute', inset:0, zIndex:0,
        background:'radial-gradient(ellipse at 70% 30%, rgba(147,104,104,0.08) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(147,104,104,0.05) 0%, transparent 50%)',
      }} />
      {/* Floating orbs for depth */}
      <div style={{
        position:'absolute', top:'15%', right:'20%', width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(147,104,104,0.06) 0%, transparent 70%)',
        filter:'blur(60px)', zIndex:0,
      }} />
      <div style={{
        position:'absolute', bottom:'20%', left:'10%', width:200, height:200, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(147,104,104,0.04) 0%, transparent 70%)',
        filter:'blur(40px)', zIndex:0,
      }} />

      {/* Content */}
      <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', minHeight:'100vh', padding:'0 80px', maxWidth:1440, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, width:'100%', alignItems:'center' }}>
          
          {/* Left Text Column */}
          <div style={{ maxWidth:620, zIndex: 10 }}>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:20 }}>End-to-End AI Platform</p>
            <h1 style={{ fontSize:'clamp(40px,5vw,72px)', fontWeight:900, lineHeight:1.08, marginBottom:24, color:'#FFFFFF', letterSpacing:'-1px' }}>
              The AI That Does<br />
              <span style={{ color:'#FFFFFF', textShadow:'0 0 40px rgba(147,104,104,0.4)' }}>Data Science</span><br />
              For You.
            </h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:18, lineHeight:1.75, maxWidth:480, marginBottom:40, fontWeight:300 }}>
              Upload your dataset. Let our AI handle EDA, cleaning, model selection, training, validation and reporting — automatically.
            </p>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                onMouseEnter={() => setHovPrimary(true)}
                onMouseLeave={() => setHovPrimary(false)}
                style={{
                  padding:'14px 32px', borderRadius:12, fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', transition:'all 0.2s', border:'none',
                  background: hovPrimary ? '#fff' : 'rgba(255,255,255,0.9)',
                  color:'#0A0A0A',
                  boxShadow: hovPrimary ? '0 12px 40px rgba(147,104,104,0.50)' : '0 8px 32px rgba(147,104,104,0.30)',
                  transform: hovPrimary ? 'translateY(-2px)' : 'none',
                  position: 'relative', zIndex: 20
                }}>
                Try Now — It&apos;s Free
              </button>
              <button
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior:'smooth' })}
                onMouseEnter={() => setHovSecondary(true)}
                onMouseLeave={() => setHovSecondary(false)}
                style={{
                  padding:'14px 32px', borderRadius:12, fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:16, cursor:'pointer', transition:'all 0.2s',
                  background: hovSecondary ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${hovSecondary ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
                  color: hovSecondary ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                  position: 'relative', zIndex: 20
                }}>
                See how it works
              </button>
            </div>
          </div>

          {/* Right Spline Iframe Column */}
          <div style={{ width: '100%', height: '700px', display: 'flex', justifyContent: 'center', pointerEvents: 'auto', position: 'relative', zIndex: 5 }}>
            <iframe 
              src='https://my.spline.design/genkubgreetingrobot-SWLNiMLDkshTlGd8rjib1WUi/' 
              frameBorder='0' 
              width='100%' 
              height='100%'
              style={{ background: 'transparent' }}
              title="AutoDS Interactive Robot"
            ></iframe>
          </div>

        </div>
      </div>
      {/* Bottom fade */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:120, zIndex:1, pointerEvents:'none', background:'linear-gradient(to top, #0A0A0A 0%, transparent 100%)' }} />
    </section>
  );
}
