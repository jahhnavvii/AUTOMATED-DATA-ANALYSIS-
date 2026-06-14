import { useState } from 'react';
import { FileDown, FileBarChart, Trophy } from 'lucide-react';
import api from '../services/api';
import useProjectStore from '../store/useProjectStore';

export default function ReportPanel({ onOpenFullReport }) {
  const { report, projectId } = useProjectStore();
  if (!report) return null;

  const download = async () => {
    const res = await api.get(`/report/${projectId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = `autods_report.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:20, fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)', display:'flex', flexDirection:'column', gap:16 }}>
      
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#FFFFFF', display:'flex', alignItems:'center', gap:6 }}>
          <Trophy size={16} color="#E5C9C9" /> Pipeline Complete
        </h3>
        <button onClick={download}
          style={{ padding:'6px 12px', background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.7)', fontSize:11, fontFamily:"'Poppins',sans-serif", fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#FFFFFF'; e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}>
          <FileDown size={14} /> Fetch PDF
        </button>
      </div>
      
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>The AI has analyzed <strong style={{ color:'#FFFFFF' }}>{report.dataset?.rows}</strong> rows, cleaned the data, engineered features, and trained multiple models.</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'rgba(199,159,151,0.06)', borderRadius:10, border:'1px solid rgba(199,159,151,0.2)' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>Winning Selection:</span>
          <span style={{ fontSize:14, color:'#E5C9C9', fontWeight:800 }}>{report.best_model}</span>
        </div>
      </div>

      <button onClick={onOpenFullReport}
        style={{ width:'100%', padding:'14px', background:'#FFFFFF', border:'none', borderRadius:10, color:'#0A0A0A', fontSize:14, fontFamily:"'Poppins',sans-serif", fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(147,104,104,0.30)', transition:'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 28px rgba(147,104,104,0.45)'; e.currentTarget.style.transform='translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(147,104,104,0.30)'; e.currentTarget.style.transform='none'; }}>
        <FileBarChart size={18} /> View Industry Report
      </button>

    </div>
  );
}
