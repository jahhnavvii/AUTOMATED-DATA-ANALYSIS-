import { useEffect, useState } from 'react';
import { UploadCloud, Search, Wand2, BoxSelect, BrainCircuit, CheckSquare, FileText } from 'lucide-react';
import useProjectStore from '../store/useProjectStore';

const STAGES = [
  { key:'upload', label:'Upload', sub:'raw file', icon: UploadCloud },
  { key:'eda', label:'EDA', sub:'shape, nulls', icon: Search },
  { key:'clean', label:'Clean', sub:'impute, cap', icon: Wand2 },
  { key:'feature_eng', label:'Features', sub:'encode, scale', icon: BoxSelect },
  { key:'train', label:'Train x4', sub:'CV scored', icon: BrainCircuit },
  { key:'validate', label:'Validate', sub:'test split', icon: CheckSquare },
  { key:'report', label:'Report', sub:'PDF + JSON', icon: FileText },
];

export default function ModelFlowChart() {
  const { logs, report, status } = useProjectStore();
  const [modelScores, setModelScores] = useState({});
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const trainLog = logs.find(l => l.stage === 'train');
    if (!trainLog) return;
    const matches = [...(trainLog.message || '').matchAll(/(\w[\w\s]+):\s([\d.]+)/g)];
    const parsed = {};
    matches.forEach(([, name, score]) => { parsed[name.trim()] = parseFloat(score); });
    if (Object.keys(parsed).length > 0) setModelScores(parsed);
    const m = (trainLog.decision || '').match(/Selected '(.+?)'/);
    if (m) setWinner(m[1]);
  }, [logs]);

  if (status === 'idle' || status === 'uploaded') return null;

  const doneStages = new Set(logs.map(l => l.stage));
  const activeStage = status === 'running' ? STAGES.find(s => !doneStages.has(s.key))?.key : null;
  const scoreEntries = Object.entries(modelScores).sort((a,b) => b[1]-a[1]);
  const maxScore = Math.max(...scoreEntries.map(([,v]) => v), 0.001);
  const bestModel = winner || report?.best_model;
  const card = { background:'rgba(255,255,255,0.02)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:14, padding:14, fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)' };
  const lbl  = { fontSize:10, fontWeight:600, color:'#C79F97', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Stage bar */}
      <div style={card}>
        <p style={lbl}>Pipeline Stages</p>
        <div style={{ display:'flex', alignItems:'center', overflowX:'auto', gap:4, paddingBottom:8 }}>
          {STAGES.map((s, i) => {
            const done = doneStages.has(s.key);
            const active = activeStage === s.key;
            const Icon = s.icon;
            return (
              <div key={s.key} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 12px', borderRadius:10, minWidth:72, transition:'all 0.3s',
                  background: done ? 'rgba(199,159,151,0.08)' : active ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: done ? '1.5px solid rgba(199,159,151,0.4)' : active ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(255,255,255,0.08)',
                }}>
                  <Icon size={16} color={done ? '#E5C9C9' : active ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize:11, fontWeight:600, color: done?'#FFFFFF':active?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.2)' }}>{s.label}</div>
                  <div style={{ fontSize:9, color: done?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.15)', marginTop:2 }}>{s.sub}</div>
                </div>
                {i < STAGES.length-1 && <div style={{ width:12, height:2, background: done?'rgba(199,159,151,0.5)':'rgba(255,255,255,0.12)', flexShrink:0, margin:'0 4px' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model competition */}
      {scoreEntries.length > 0 && (
        <div style={card}>
          <p style={lbl}>Model Competition</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {scoreEntries.map(([name, score]) => {
              const isWinner = name === bestModel;
              return (
                <div key={name} style={{ padding:'12px 14px', borderRadius:10, transition:'all 0.3s',
                  background: isWinner?'rgba(199,159,151,0.08)':'rgba(255,255,255,0.02)',
                  border: isWinner?'1.5px solid rgba(199,159,151,0.4)':'1.5px solid rgba(255,255,255,0.08)',
                  boxShadow: isWinner?'0 0 16px rgba(147,104,104,0.15)':'none',
                }}>
                  {isWinner && <span style={{ fontSize:9, padding:'2px 8px', background:'rgba(229,201,201,0.15)', color:'#E5C9C9', borderRadius:20, display:'inline-block', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Best Model</span>}
                  <div style={{ fontSize:12, fontWeight:isWinner?700:500, color:isWinner?'#FFFFFF':'rgba(255,255,255,0.7)', marginBottom:8 }}>{name}</div>
                  <div style={{ height:4, background:'rgba(255,255,255,0.04)', borderRadius:2, marginBottom:6 }}>
                    <div style={{ height:4, background:isWinner?'#E5C9C9':'rgba(255,255,255,0.2)', borderRadius:2, width:`${(score/maxScore)*100}%`, transition:'width 0.7s ease' }} />
                  </div>
                  <div style={{ fontSize:11, color:isWinner?'#C79F97':'rgba(255,255,255,0.4)', fontWeight:700 }}>{score.toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
