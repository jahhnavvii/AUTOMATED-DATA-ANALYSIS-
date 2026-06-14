import { useState } from 'react';
import { Play, Activity, CheckCircle2, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import useProjectStore from '../store/useProjectStore';

export default function PredictionPanel() {
  const { projectId, featureColumns, report, predictionResult, setPredictionResult, predictionHistory, addPredictionHistory, clearPredictionResult } = useProjectStore();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  if (!featureColumns || featureColumns.length === 0) return null;

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      // Cast numeric inputs
      const payload = { ...formData };
      featureColumns.forEach(col => {
        if (col.type === 'numeric' && payload[col.name]) {
          payload[col.name] = Number(payload[col.name]);
        }
      });

      const res = await api.post(`/predict/${projectId}`, { features: payload });
      setPredictionResult(res.data);
      addPredictionHistory({ input: payload, result: res.data, timestamp: new Date() });
    } catch (e) {
      alert(e.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'24px', fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)' };
  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.04)', color:'#FFFFFF', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:13, fontFamily:"'Poppins',sans-serif", outline:'none', transition:'border-color 0.2s' };
  const selectStyle = { ...inputStyle, background:'#141414', color:'#FFFFFF' };
  
  return (
    <div style={card}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#FFFFFF', display:'flex', alignItems:'center', gap:8 }}>
          <Activity size={18} color="#E5C9C9" /> Make Predictions
        </h3>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:20 }}>
          Target: <strong style={{ color:'#FFFFFF' }}>{report?.target_column}</strong>
        </span>
      </div>
      
      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:24, lineHeight:1.6 }}>
        Use the deployed <strong>{report?.best_model}</strong> model to predict outcomes on new data.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16, marginBottom:24 }}>
        {featureColumns.map(col => (
          <div key={col.name}>
            <label style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6, fontWeight:500 }}>
              {col.name} {col.type === 'numeric' ? '(Num)' : '(Cat)'}
            </label>
            {col.type === 'categorical' && col.unique_values ? (
              <select 
                style={selectStyle} 
                value={formData[col.name] || ''} 
                onChange={e => handleChange(col.name, e.target.value)}
              >
                <option value="" disabled>Select {col.name}...</option>
                {col.unique_values.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : col.type === 'numeric' ? (
              <input 
                type="number" 
                step="any"
                style={inputStyle} 
                placeholder={`e.g. ${col.mean ? col.mean.toFixed(2) : '0'}`}
                value={formData[col.name] || ''} 
                onChange={e => handleChange(col.name, e.target.value)} 
              />
            ) : (
              <input 
                type="text" 
                style={inputStyle} 
                value={formData[col.name] || ''} 
                onChange={e => handleChange(col.name, e.target.value)} 
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <button 
          onClick={handlePredict} 
          disabled={loading}
          style={{ padding:'12px 24px', background:'#E5C9C9', border:'none', borderRadius:10, color:'#0A0A0A', fontSize:14, fontFamily:"'Poppins',sans-serif", fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(229,201,201,0.2)', transition:'all 0.2s', opacity: loading ? 0.7 : 1 }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 24px rgba(229,201,201,0.4)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(229,201,201,0.2)'; e.currentTarget.style.transform='none'; }}
        >
          {loading ? 'Predicting...' : <><Play size={16} fill="#0A0A0A" /> Predict</>}
        </button>
        <button onClick={() => { setFormData({}); clearPredictionResult(); }} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer' }}>
          Clear All
        </button>
      </div>

      {/* Result Display */}
      {predictionResult && (
        <div style={{ marginTop:24, padding:'20px', background:'rgba(199,159,151,0.06)', borderRadius:12, border:'1px solid rgba(199,159,151,0.2)', animation:'fadeInUp 0.4s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Predicted Value</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:32, fontWeight:800, color:'#FFFFFF' }}>{predictionResult.prediction}</span>
                {predictionResult.confidence && (
                  <span style={{ background:'rgba(255,255,255,0.1)', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600, color:'#C79F97', display:'flex', alignItems:'center', gap:4 }}>
                    <CheckCircle2 size={12} /> {predictionResult.confidence}% Confidence
                  </span>
                )}
              </div>
            </div>
            <button onClick={clearPredictionResult} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>
          
          {predictionResult.probabilities && Object.keys(predictionResult.probabilities).length > 0 && (
            <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16 }}>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Class Probabilities</p>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                {Object.entries(predictionResult.probabilities).map(([cls, prob]) => (
                  <div key={cls} style={{ background:'rgba(255,255,255,0.03)', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginRight:8 }}>{cls}</span>
                    <span style={{ fontSize:12, color:'#FFF', fontWeight:600 }}>{prob}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {predictionHistory.length > 0 && (
        <div style={{ marginTop:32 }}>
          <h4 style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Recent Predictions</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {predictionHistory.slice(0, 3).map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, overflow:'hidden' }}>
                  <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
                  <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, flexWrap:'nowrap' }}>
                    {Object.entries(item.input).filter(([,v]) => v !== '' && v !== undefined).slice(0, 4).map(([k, v]) => (
                      <span key={k} style={{ fontSize:11, color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>
                        {k}: <strong style={{ color:'rgba(255,255,255,0.8)' }}>{v}</strong>
                      </span>
                    ))}
                    {Object.keys(item.input).length > 4 && <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>...</span>}
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'#C79F97', background:'rgba(199,159,151,0.1)', padding:'4px 10px', borderRadius:6 }}>
                  {item.result.prediction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
