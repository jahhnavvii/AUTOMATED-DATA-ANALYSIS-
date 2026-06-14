import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { setAccessToken } from '../services/api';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [isSignup, setIsSignup] = useState(params.get('signup') === 'true');
  const [form, setForm] = useState({ username: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      if (isSignup) {
        await api.post('/auth/register', form);
      }
      const res = await api.post('/auth/login', { username: form.username, password: form.password });
      setAccessToken(res.data.access_token);
      navigate('/workspace');
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,0.04)', color:'#FFFFFF',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
    padding:'12px 16px', marginBottom:14, fontSize:14, fontFamily:"'Poppins',sans-serif",
    outline:'none', boxSizing:'border-box', transition:'border-color 0.2s',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px', fontFamily:"'Poppins',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:420, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:36, boxShadow:'0 8px 40px rgba(147,104,104,0.15)', animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#FFFFFF', marginBottom:6, letterSpacing:'-0.5px', animation: 'breathingShadow 4s infinite ease-in-out' }}>AutoDS</h1>
        <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:28, fontSize:14, fontWeight:300 }}>{isSignup ? 'Create your account' : 'Welcome back'}</p>
        {isSignup && (
          <input style={inputStyle} placeholder="Full Name" value={form.full_name}
            onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
            onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.25)'}
            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        )}
        <input style={inputStyle} placeholder="Username" type="text" value={form.username}
          onChange={e => setForm(f => ({...f, username: e.target.value}))}
          onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.25)'}
          onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        <input style={inputStyle} placeholder="Password" type="password" value={form.password}
          onChange={e => setForm(f => ({...f, password: e.target.value}))}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          onFocus={e => e.target.style.borderColor='rgba(255,255,255,0.25)'}
          onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        {error && <p style={{ color:'#F09595', fontSize:13, marginBottom:12 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'13px', background:'#FFFFFF', border:'none', borderRadius:10, color:'#0A0A0A', fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer', boxShadow:'0 4px 20px rgba(147,104,104,0.30)', opacity: loading ? 0.6 : 1, transition:'all 0.2s' }}>
          {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
        </button>
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', marginTop:18, fontSize:13 }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button style={{ background:'none', border:'none', color:'#FFFFFF', marginLeft:6, cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontSize:13, textDecoration:'underline' }} onClick={() => setIsSignup(v => !v)}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0 8px' }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
          <span style={{ color:'rgba(255,255,255,0.25)', fontSize:12, fontFamily:"'Poppins',sans-serif", letterSpacing:1, textTransform:'uppercase' }}>or</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }} />
        </div>
        <button
          onClick={async () => {
            setLoading(true); setError('');
            try {
              const res = await api.post('/auth/guest-login');
              setAccessToken(res.data.access_token);
              navigate('/workspace');
            } catch (e) {
              setError(e.response?.data?.detail || 'Guest login failed');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={{
            width:'100%', padding:'13px', background:'transparent',
            border:'1px solid rgba(255,255,255,0.15)', borderRadius:10,
            color:'rgba(255,255,255,0.7)', fontFamily:"'Poppins',sans-serif",
            fontWeight:600, fontSize:14, cursor:'pointer',
            backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
            transition:'all 0.25s ease',
            opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={e => { e.target.style.borderColor='rgba(255,255,255,0.35)'; e.target.style.color='#FFFFFF'; e.target.style.background='rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.color='rgba(255,255,255,0.7)'; e.target.style.background='transparent'; }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
