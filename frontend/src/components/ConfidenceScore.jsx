import useProjectStore from '../store/useProjectStore';

export default function ConfidenceScore() {
  const score = useProjectStore(s => s.confidenceScore);
  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'20px 16px', textAlign:'center', fontFamily:"'Poppins',sans-serif" };
  if (score === null) return (
    <div style={card}>
      <div style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>Confidence score will appear after pipeline completes</div>
    </div>
  );
  const glow = score >= 80 ? '0 0 32px rgba(147,104,104,0.25)' : score >= 60 ? '0 0 24px rgba(147,104,104,0.15)' : '0 0 24px rgba(240,149,149,0.15)';
  return (
    <div style={{ ...card, boxShadow:glow }}>
      <p style={{ fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Confidence Score</p>
      <p style={{ fontSize:56, fontWeight:900, color:'#FFFFFF', lineHeight:1, letterSpacing:'-2px', textShadow:'0 0 30px rgba(147,104,104,0.3)' }}>{score}%</p>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:8, fontWeight:300 }}>
        {score >= 80 ? 'Excellent — model is reliable' : score >= 60 ? 'Good — use with care' : 'Low — consider more data'}
      </p>
    </div>
  );
}
