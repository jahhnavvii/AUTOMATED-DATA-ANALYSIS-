import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../store/useProjectStore';
import api from '../services/api';
import UploadCard from '../components/UploadCard';
import DatasetPreview from '../components/DatasetPreview';
import PredictionSelector from '../components/PredictionSelector';
import AIScriptBox from '../components/AIScriptBox';
import DecisionBox from '../components/DecisionBox';
import ConfidenceScore from '../components/ConfidenceScore';
import ModelFlowChart from '../components/ModelFlowChart';
import DashboardBox from '../components/DashboardBox';
import ReportPanel from '../components/ReportPanel';
import FullReportView from '../components/FullReportView';
import PredictionPanel from '../components/PredictionPanel';

export default function WorkspacePage() {
  const { projectId, datasetId, selectedTask, status, setStatus, addLog, setReport, reset } = useProjectStore();
  const [showFullReport, setShowFullReport] = useState(false);
  const navigate = useNavigate();

  const startPipeline = async () => {
    if (!projectId || !datasetId || !selectedTask) return;
    setStatus('running');
    await api.post('/pipeline/start', { project_id: projectId, dataset_id: datasetId, prediction_task: selectedTask });
    const ws = new WebSocket(`ws://localhost:8000/pipeline/ws/logs/${projectId}`);
    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      addLog(data);
      if (data.stage === 'complete') {
        ws.close();
        setStatus(data.status);
        if (data.status === 'done') {
          const res = await api.get(`/report/${projectId}`);
          setReport(res.data);
        }
      }
    };
  };

  const card = {
    background:'rgba(255,255,255,0.02)',
    border:'1.5px solid rgba(255,255,255,0.12)',
    borderRadius:16,
    padding:'20px',
    boxShadow:'0 2px 16px rgba(147,104,104,0.06)',
    width:'100%',
    opacity: 0,
    animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', color:'#FFFFFF', fontFamily:"'Poppins',sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)', position:'sticky', top:0, zIndex:10, backdropFilter:'blur(12px)' }}>
        <span style={{ fontSize:20, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.5px', textShadow:'0 0 20px rgba(147,104,104,0.2)' }}>AutoDS</span>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {status === 'running' && (
            <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.6)' }}>
              <span style={{ width:8, height:8, background:'#FFFFFF', borderRadius:'50%', animation:'pulse 1s infinite', boxShadow:'0 0 8px rgba(147,104,104,0.3)' }} />
              Pipeline Running
            </span>
          )}
          {status === 'done' && <span style={{ fontSize:13, color:'#FFFFFF', fontWeight:600 }}>✓ Complete</span>}
          <button onClick={() => { reset(); navigate('/'); }}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13, fontFamily:"'Poppins',sans-serif", transition:'color 0.2s' }}
            onMouseEnter={e => e.target.style.color='#FFFFFF'}
            onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.4)'}>
            ← Home
          </button>
        </div>
      </div>

      {/* 2-Panel Layout Grid */}
      <div className="workspace-grid" style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr', 
        gap: '24px', 
        padding: '24px',
        maxWidth: '1800px',
        margin: '0 auto',
        width: '100%'
      }}>
        
        {/* Left Sidebar (Setup & Controls) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{...card, animationDelay: '0s'}}>
            <h2 style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>1 — Upload Your Data</h2>
            <UploadCard />
          </div>

          {datasetId && (
            <div style={{...card, animationDelay: '0.3s'}}>
              <h2 style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>2 — Choose Prediction Task</h2>
              <PredictionSelector />
            </div>
          )}

          {selectedTask && status !== 'running' && status !== 'done' && (
            <button onClick={startPipeline}
              style={{
                width:'100%', padding:'16px', border:'none', borderRadius:12,
                color:'#0A0A0A', fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:15, textTransform: 'uppercase', letterSpacing: '0.5px',
                cursor:'pointer', transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                background: 'linear-gradient(90deg, #FFFFFF, #E5C9C9, #FFFFFF)',
                backgroundSize: '200% 100%',
                animation: 'movingGradient 4s infinite linear, fadeInUp 0.6s forwards',
                animationDelay: '0s, 0.45s',
                opacity: 0,
                boxShadow:'0 4px 24px rgba(147,104,104,0.30)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(147,104,104,0.60)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 24px rgba(147,104,104,0.30)'; e.currentTarget.style.transform='none'; }}>
              Run Pipeline ▶
            </button>
          )}

          {status === 'done' && (
            <div style={{...card, animationDelay: '0.1s'}}>
              <ConfidenceScore />
              <div style={{ marginTop: 16 }}>
                <ReportPanel onOpenFullReport={() => setShowFullReport(true)} />
              </div>
            </div>
          )}

        </div>

        {/* Right Main Area (Results & Data) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowX: 'hidden' }}>
          
          <div style={{ opacity: 0, animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: '0.15s' }}>
            <DatasetPreview />
          </div>

          {(status === 'running' || status === 'done' || status === 'failed') && (
            <div style={{...card, animationDelay: '0.1s'}}>
              <h2 style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>3 — AI Processing</h2>
              <ModelFlowChart />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: 16 }}>
                <AIScriptBox />
                <DecisionBox />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{...card, animationDelay: '0.2s'}}>
                <DashboardBox />
              </div>
              <div style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: '0.3s' }}>
                <PredictionPanel />
              </div>
            </div>
          )}

        </div>

      </div>

      {showFullReport && <FullReportView onClose={() => setShowFullReport(false)} />}
    </div>
  );
}
