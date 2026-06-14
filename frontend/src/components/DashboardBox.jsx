import useProjectStore from '../store/useProjectStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

export default function DashboardBox() {
  const report = useProjectStore(s => s.report);
  const card = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'16px 20px', fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 16px rgba(147,104,104,0.08)' };
  
  if (!report) return (
    <div style={{ ...card, height:240, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'rgba(255,255,255,0.2)', fontSize:13 }}>Charts will appear after pipeline completes</span>
    </div>
  );

  const fi = report.feature_importance || {};
  const fiData = Object.entries(fi).slice(0, 8).map(([name, value]) => ({ name, value: value * 100 }));
  
  const rawMetrics = report.metrics || {};
  const metricsData = Object.entries(rawMetrics).map(([name, value]) => ({ subject: name.replace('_', ' ').toUpperCase(), A: typeof value === 'number' ? value : 0 }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      
      {/* Feature Importance Chart */}
      <div style={card}>
        <h3 style={{ fontSize:10, fontWeight:600, color:'#C79F97', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Feature Importance</h3>
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={fiData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 300 }} width={90} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.04)' }} 
                contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#FFFFFF' }} 
                itemStyle={{ color: '#E5C9C9', fontWeight: 600 }}
                formatter={(val) => [`${val.toFixed(1)}%`, 'Importance']}
              />
              <Bar dataKey="value" fill="#E5C9C9" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Radar/Bar Chart */}
      <div style={card}>
        <h3 style={{ fontSize:10, fontWeight:600, color:'#C79F97', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20 }}>Model Metrics</h3>
        
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {Object.entries(rawMetrics).map(([k, v]) => (
            <div key={k} style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'capitalize', fontWeight:500, marginBottom:4 }}>{k.replace('_',' ')}</p>
              <p style={{ fontSize:18, fontWeight:700, color:'#FFFFFF' }}>{typeof v === 'number' ? v.toFixed(4) : v}</p>
            </div>
          ))}
        </div>

        {report.problem_type === 'classification' && metricsData.length > 2 && (
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metricsData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Radar name="Metrics" dataKey="A" stroke="#C79F97" fill="#C79F97" fillOpacity={0.4} />
                <Tooltip 
                  contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#FFFFFF' }} 
                  itemStyle={{ color: '#E5C9C9', fontWeight: 600 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
