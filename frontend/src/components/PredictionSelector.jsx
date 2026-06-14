import { useEffect, useState } from 'react';
import api from '../services/api';
import useProjectStore from '../store/useProjectStore';

export default function PredictionSelector() {
  const { datasetId, domain, tasks, selectedTask, setDomainInfo, setSelectedTask } = useProjectStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!datasetId || domain) return;
    setLoading(true);
    api.get(`/pipeline/domains/${datasetId}`)
      .then(r => setDomainInfo(r.data))
      .finally(() => setLoading(false));
  }, [datasetId]);

  if (!datasetId) return null;
  if (loading) return <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:500, fontFamily:"'Poppins',sans-serif" }}>Detecting domain...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, fontFamily:"'Poppins',sans-serif" }}>
      {domain && (
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:300 }}>Detected Domain:</span>
          <span style={{ padding:'3px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, color:'#FFFFFF', fontSize:11, fontWeight:600, textTransform:'uppercase' }}>{domain}</span>
        </div>
      )}
      <div>
        <label style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600, display:'block', marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase' }}>Select Prediction Task</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {tasks.map(task => (
            <button key={task} onClick={() => setSelectedTask(task)}
              style={{
                width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:10,
                fontSize:13, fontFamily:"'Poppins',sans-serif", cursor:'pointer', transition:'all 0.2s',
                background: selectedTask === task ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: selectedTask === task ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                fontWeight: selectedTask === task ? 600 : 400,
                boxShadow: selectedTask === task ? '0 2px 12px rgba(147,104,104,0.15)' : 'none',
              }}>{task}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
