import { useEffect, useRef } from 'react';
import { TerminalSquare, ChevronRight } from 'lucide-react';
import useProjectStore from '../store/useProjectStore';

export default function AIScriptBox() {
  const logs = useProjectStore(s => s.logs);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:16, height:320, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)' }}>
      <h3 style={{ fontSize:10, fontWeight:600, color:'#C79F97', letterSpacing:'0.12em', textTransform:'uppercase', position:'sticky', top:0, background:'rgba(10,10,10,0.9)', paddingBottom:8, backdropFilter:'blur(4px)', zIndex:1, display:'flex', alignItems:'center', gap:6 }}>
        <TerminalSquare size={14} color="#C79F97" /> AI Reasoning — Step by Step
      </h3>
      {logs.length === 0 && <p style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>Pipeline logs will appear here as the AI works...</p>}
      {logs.map((log, i) => log.message && (
        <div key={i} style={{ fontSize:12, lineHeight:1.65, padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', animation:'fadeInUp 0.3s ease', display:'flex', alignItems:'flex-start', gap:6 }}>
          <ChevronRight size={14} color="#C79F97" style={{ marginTop: 2, flexShrink:0 }} />
          <div>
            <span style={{ fontWeight:700, color:'#FFF', marginRight:6, fontSize:10, padding:'2px 6px', background:'rgba(199,159,151,0.15)', border:'1px solid rgba(199,159,151,0.3)', borderRadius:4, textTransform:'uppercase' }}>{log.stage}</span>
            <span style={{ color:'rgba(255,255,255,0.7)', fontWeight:300 }}>{log.message}</span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
