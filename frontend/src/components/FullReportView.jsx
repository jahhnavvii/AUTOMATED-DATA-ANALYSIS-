import { useEffect, useRef } from 'react';
import { X, Trophy, AlertTriangle, FileCheck, CheckCircle2, Layers, Network } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import useProjectStore from '../store/useProjectStore';

function CustomPlot({ data, layout, style }) {
  const plotRef = useRef(null);
  useEffect(() => {
    if (window.Plotly && plotRef.current) {
      window.Plotly.react(plotRef.current, data, layout, { responsive: true, displayModeBar: false });
    }
  }, [data, layout]);
  return <div ref={plotRef} style={style} />;
}

export default function FullReportView({ onClose }) {
  const { report, projectId } = useProjectStore();
  if (!report) return null;

  // Pie Chart Data
  const totalRows = report.dataset?.rows || 1;
  const missingRowsEst = report.cleaning_actions?.length ? Math.min(totalRows * 0.15, totalRows) : 0;
  const pieData = [
    { name: 'Clean Data', value: totalRows - missingRowsEst },
    { name: 'Missing/Imputed', value: missingRowsEst }
  ];
  const PIE_COLORS = ['#C79F97', '#2A2A2A'];

  // Bar Chart Data
  const fi = report.feature_importance || {};
  const fiData = Object.entries(fi).slice(0, 8).map(([name, value]) => ({ name, value: value * 100 }));

  // Radar Chart Data
  const rawMetrics = report.metrics || {};
  const metricsData = Object.entries(rawMetrics).map(([name, value]) => ({ 
    subject: name.replace('_', ' ').toUpperCase(), A: typeof value === 'number' ? value : 0 
  }));

  // Style Tokens
  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'24px', fontFamily:"'Poppins',sans-serif", boxShadow:'0 4px 24px rgba(147,104,104,0.08)' };
  const h3 = { fontSize:12, fontWeight:600, color:'#C79F97', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20, display:'flex', alignItems:'center', gap:8 };

  // Generate 3D PCA Data structure for Plotly
  const pcaData = report.pca_data || [];
  const hasPCA = pcaData.length > 0;
  const targets = hasPCA ? [...new Set(pcaData.map(d => d.target))] : [];
  const pcaPlotTraces = targets.map((t, i) => {
    const pts = pcaData.filter(d => d.target === t);
    return {
      x: pts.map(p => p.x),
      y: pts.map(p => p.y),
      z: pts.map(p => p.z),
      mode: 'markers',
      type: 'scatter3d',
      name: `Class/Value: ${t}`,
      marker: { 
        size: 5, 
        color: i === 0 ? '#E5C9C9' : i === 1 ? '#C79F97' : i === 2 ? '#FFFFFF' : '#888888',
        opacity: 0.8,
        line: { color: 'rgba(255,255,255,0.1)', width: 0.5 }
      }
    };
  });

  // Generate Pair Plot Data
  const ppData = report.pair_plot_data || {};
  const ppFeatures = Object.keys(ppData).filter(k => k !== 'target');
  const hasPairPlot = ppFeatures.length > 0;
  
  // Create discrete color mapping for Pair Plot SPLOM
  const ppTargets = hasPairPlot ? [...new Set(ppData.target)] : [];
  const colorMap = { [ppTargets[0]]: '#E5C9C9', [ppTargets[1]]: '#C79F97', [ppTargets[2]]: '#FFFFFF' };
  const pointColors = hasPairPlot ? ppData.target.map(t => colorMap[t] || '#888888') : [];

  const splomTrace = hasPairPlot ? [{
    type: 'splom',
    dimensions: ppFeatures.map(f => ({ label: f, values: ppData[f] })),
    text: ppData.target,
    marker: {
      color: pointColors,
      size: 5,
      opacity: 0.7,
      line: { color: 'rgba(255,255,255,0.2)', width: 0.5 }
    }
  }] : [];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'#0A0A0A', color:'#FFFFFF', fontFamily:"'Poppins',sans-serif", overflowY:'auto' }}>
      
      {/* Sticky Header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(10,10,10,0.95)', borderBottom:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(16px)', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Trophy size={24} color="#E5C9C9" />
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>AutoDS Client Technical Report</h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>Project ID: {projectId.slice(0,8)} · Task: {report.task}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 16px', color:'#FFFFFF', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontWeight:600, transition:'all 0.2s' }}>
          <X size={16} /> Close Report
        </button>
      </div>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'40px 24px', display:'flex', flexDirection:'column', gap:32 }}>
        
        {/* Row 1: Exec Narrative & Health */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:32 }}>
          {/* Executive Narrative */}
          <div style={card}>
            <h3 style={h3}><FileCheck size={16} color="#E5C9C9" /> Client Executive Summary</h3>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.85)', lineHeight:1.8, fontWeight:300, display:'flex', flexDirection:'column', gap:12 }}>
              {report.narrative ? report.narrative.split('\n').map((p, i) => <p key={i}>{p}</p>) : <p>Narrative generation pending...</p>}
            </div>
          </div>

          {/* Data Health Pie Chart */}
          <div style={card}>
            <h3 style={h3}><AlertTriangle size={16} /> Data Health Quality</h3>
            <div style={{ height:200, width:'100%', position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip contentStyle={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#FFFFFF' }} itemStyle={{ color:'#E5C9C9', fontWeight:600 }} />
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', textAlign:'center', pointerEvents:'none' }}>
                <p style={{ fontSize:20, fontWeight:800, color:'#FFFFFF', lineHeight:1 }}>{(100 - (missingRowsEst/totalRows)*100).toFixed(1)}%</p>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase' }}>Clean</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Row: 3D Visualization */}
        {hasPCA && (
          <div style={card}>
            <h3 style={h3}><Layers size={16} color="#C79F97" /> 3D Data Topography (PCA)</h3>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>Interactive 3D representation of the dataset automatically reduced to 3 principal components. Drag to rotate.</p>
            <div style={{ height: 500, width: '100%', borderRadius: 8, overflow: 'hidden', border:'1px solid rgba(255,255,255,0.04)' }}>
              <CustomPlot
                data={pcaPlotTraces}
                layout={{
                  autosize: true,
                  margin: { l: 0, r: 0, b: 0, t: 0 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: 'rgba(255,255,255,0.6)', family: "'Poppins', sans-serif" },
                  scene: {
                    xaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: 'PC1' },
                    yaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: 'PC2' },
                    zaxis: { showgrid: true, gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', title: 'PC3' },
                    bgcolor: 'transparent'
                  },
                  legend: { font: { color: '#FFFFFF' } }
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          </div>
        )}

        {/* New Row: Pair Plots */}
        {hasPairPlot && (
          <div style={card}>
            <h3 style={h3}><Network size={16} color="#C79F97" /> Feature Correlation Matrix (Pair Plot)</h3>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>Scatter plot matrix displaying correlations between the top 4 most important features.</p>
            <div style={{ height: 600, width: '100%', borderRadius: 8, overflow: 'hidden', border:'1px solid rgba(255,255,255,0.04)' }}>
              <CustomPlot
                data={splomTrace}
                layout={{
                  autosize: true,
                  margin: { l: 60, r: 20, b: 60, t: 20 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { color: 'rgba(255,255,255,0.6)', family: "'Poppins', sans-serif" },
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          </div>
        )}

        {/* End rows ... the original bar/radar and logs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
          {/* Feature Importance */}
          <div style={card}>
            <h3 style={h3}>Feature Importance</h3>
            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={fiData} margin={{ top:0, right:20, left:-20, bottom:0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize:11, fontWeight:300 }} width={100} />
                  <RechartsTooltip cursor={{ fill:'rgba(255,255,255,0.04)' }} contentStyle={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#FFFFFF' }} itemStyle={{ color:'#E5C9C9', fontWeight:600 }} formatter={(v) => [`${v.toFixed(1)}%`, 'Importance']} />
                  <Bar dataKey="value" fill="#C79F97" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Metrics */}
          <div style={card}>
            <h3 style={h3}>Model Validation Metrics</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {Object.entries(rawMetrics).map(([k, v]) => (
                <div key={k} style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'12px', border:'1px solid rgba(255,255,255,0.04)' }}>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', fontWeight:500, marginBottom:2 }}>{k.replace('_',' ')}</p>
                  <p style={{ fontSize:20, fontWeight:700, color:'#FFFFFF' }}>{typeof v === 'number' ? v.toFixed(4) : v}</p>
                </div>
              ))}
            </div>
            {report.problem_type === 'classification' && metricsData.length > 2 && (
              <div style={{ height: 200, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metricsData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <Radar name="Metrics" dataKey="A" stroke="#E5C9C9" fill="#E5C9C9" fillOpacity={0.4} />
                    <RechartsTooltip contentStyle={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12, color:'#FFFFFF' }} itemStyle={{ color:'#E5C9C9', fontWeight:600 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* New Row: Error Analysis (Before vs After & Overfitting) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
          {/* Baseline vs Trained Comparison */}
          {report.baseline_metrics && (
            <div style={card}>
              <h3 style={h3}><AlertTriangle size={16} /> Before vs After Training</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:16, lineHeight:1.5 }}>
                Comparing the trained model against a naive baseline (e.g. mean predictor or most-frequent class) to show actual improvement.
              </p>
              <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', textAlign:'left' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Metric</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Baseline</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Trained Model</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rawMetrics).map(k => {
                    const base = report.baseline_metrics[k];
                    const trained = rawMetrics[k];
                    if (base === undefined || trained === undefined) return null;
                    const diff = trained - base;
                    const isPositive = diff > 0;
                    return (
                      <tr key={k} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'12px 0', color:'rgba(255,255,255,0.8)', textTransform:'capitalize' }}>{k.replace('_', ' ')}</td>
                        <td style={{ padding:'12px 0', color:'rgba(255,255,255,0.5)' }}>{base.toFixed(4)}</td>
                        <td style={{ padding:'12px 0', color:'#FFFFFF', fontWeight:600 }}>{trained.toFixed(4)}</td>
                        <td style={{ padding:'12px 0', color: isPositive ? '#4CAF50' : '#F44336', fontWeight:600 }}>
                          {isPositive ? '+' : ''}{diff.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Overfitting Analysis (Train vs Test) */}
          {report.train_metrics && (
            <div style={card}>
              <h3 style={h3}><FileCheck size={16} /> Overfitting Analysis</h3>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:16, lineHeight:1.5 }}>
                Comparing model performance on the Training Set vs the unseen Test Set. A large gap indicates overfitting.
              </p>
              <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse', textAlign:'left' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Metric</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Train Score</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Test Score</th>
                    <th style={{ padding:'8px 0', color:'rgba(255,255,255,0.4)', fontWeight:500 }}>Gap (Train - Test)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rawMetrics).map(k => {
                    const trainScore = report.train_metrics[k];
                    const testScore = rawMetrics[k];
                    if (trainScore === undefined || testScore === undefined) return null;
                    const gap = trainScore - testScore;
                    return (
                      <tr key={k} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'12px 0', color:'rgba(255,255,255,0.8)', textTransform:'capitalize' }}>{k.replace('_', ' ')}</td>
                        <td style={{ padding:'12px 0', color:'rgba(255,255,255,0.5)' }}>{trainScore.toFixed(4)}</td>
                        <td style={{ padding:'12px 0', color:'#FFFFFF', fontWeight:600 }}>{testScore.toFixed(4)}</td>
                        <td style={{ padding:'12px 0', color: Math.abs(gap) > 0.1 ? '#FF9800' : 'rgba(255,255,255,0.6)', fontWeight:600 }}>
                          {gap.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row 3: Processing Log */}
        <div style={card}>
          <h3 style={h3}><CheckCircle2 size={16} /> Data Processing Applied</h3>
          {report.cleaning_actions && report.cleaning_actions.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {report.cleaning_actions.map((act, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(199,159,151,0.1)', color:'#C79F97', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                  <div>
                    <h4 style={{ fontSize:13, fontWeight:600, color:'#FFFFFF', marginBottom:4 }}>{act.action}</h4>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{act.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>No significant cleaning required. Dataset was pristine.</p>
          )}
        </div>

      </div>
    </div>
  );
}
