import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <nav style={{
      position:'fixed', top:0, width:'100%', zIndex:50, transition:'all 0.3s',
      background: scrolled ? 'rgba(10,10,10,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
      fontFamily:"'Poppins',sans-serif",
    }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:22, fontWeight:800, color:'#FFFFFF', letterSpacing:'-0.5px', textShadow:'0 0 20px rgba(147,104,104,0.3)' }}>AutoDS</span>
        <div style={{ display:'flex', gap:32, fontSize:14, fontWeight:500 }}>
          {['hero','about','timeline'].map(id => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:14, transition:'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#FFFFFF'}
              onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.5)'}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => navigate('/auth')}
            style={{ padding:'8px 18px', background:'none', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'rgba(255,255,255,0.7)', cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:13, transition:'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor='rgba(255,255,255,0.3)'; e.target.style.color='#fff'; }}
            onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.color='rgba(255,255,255,0.7)'; }}>
            Login
          </button>
          <button onClick={() => navigate('/auth?signup=true')}
            style={{ padding:'8px 18px', background:'#FFFFFF', border:'none', borderRadius:8, color:'#0A0A0A', cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, transition:'all 0.2s', boxShadow:'0 4px 16px rgba(147,104,104,0.25)' }}
            onMouseEnter={e => { e.target.style.boxShadow='0 6px 24px rgba(147,104,104,0.45)'; e.target.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.target.style.boxShadow='0 4px 16px rgba(147,104,104,0.25)'; e.target.style.transform='none'; }}>
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}
