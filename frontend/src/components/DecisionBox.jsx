import { useEffect, useRef } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import useProjectStore from '../store/useProjectStore';

export default function DecisionBox() {
  const logs = useProjectStore(s => s.logs);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:16, height:320, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)' }}>
      <h3 style={{ fontSize:10, fontWeight:600, color:'#E5C9C9', letterSpacing:'0.12em', textTransform:'uppercase', position:'sticky', top:0, background:'rgba(10,10,10,0.9)', paddingBottom:8, backdropFilter:'blur(4px)', zIndex:1, display:'flex', alignItems:'center', gap:6 }}>
        <Zap size={14} color="#E5C9C9" /> Decisions Taken
      </h3>
      {logs.length === 0 && <p style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>AI decisions will appear here...</p>}
      {logs.map((log, i) => log.decision && (
        <div key={i} style={{ display:'flex', gap:8, fontSize:12, lineHeight:1.65, padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:6, border:'1px solid rgba(255,255,255,0.08)' }}>
          <CheckCircle2 size={14} color="#C79F97" style={{ marginTop: 2, flexShrink:0 }} />
          <span style={{ color:'rgba(255,255,255,0.8)', fontWeight:300 }}>{log.decision}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
