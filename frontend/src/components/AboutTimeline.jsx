import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Search, Wand2, BrainCircuit, FileBarChart, Bot } from 'lucide-react';

const STAGES = [
  { icon: UploadCloud, title: 'Upload Dataset', desc: 'Drag and drop your CSV or Excel file. The AI immediately begins analysis.' },
  { icon: Search, title: 'EDA', desc: 'Exploratory Data Analysis: shape, nulls, distributions, types — all computed automatically.' },
  { icon: Wand2, title: 'Data Cleaning', desc: 'Duplicates removed, missing values imputed, outliers capped. Cleaned data returned to you.' },
  { icon: BrainCircuit, title: 'Model Training', desc: 'Multiple models trained and compared. Best model selected by cross-validation score.' },
  { icon: FileBarChart, title: 'Report', desc: 'Full PDF report with metrics, feature importance, confidence score and recommendations.' },
];

export default function AboutTimeline() {
  const [visible, setVisible] = useState([]);
  const refs = useRef([]);

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setVisible(v => [...new Set([...v, i])]);
      }, { threshold: 0.3 });
      if (el) obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <section id="timeline" style={{ padding:'96px 24px', maxWidth:860, margin:'0 auto', fontFamily:"'Poppins',sans-serif" }}>

      {/* About The Platform Card */}
      <div id="about" style={{ marginBottom: 96, padding: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #C79F97, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(199,159,151,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={24} color="#C79F97" />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 12, letterSpacing: '-0.5px' }}>About the Platform</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.8, fontWeight: 300 }}>
              AutoDS is built to democratize data science. We believe that extracting clean, highly-predictive models from raw data shouldn't strictly require a senior data scientist. By leveraging advanced Machine Learning engines and Large Language Models, our platform entirely automates the rigorous cycle of Exploratory Data Analysis (EDA), anomaly cleaning, intelligent feature engineering, and intense model selection battles to hand you an industry-ready report instantly.
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize:40, fontWeight:900, textAlign:'center', marginBottom:12, color:'#FFFFFF', letterSpacing:'-0.5px' }}>How It Works</h2>
      <p style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', marginBottom:64, fontSize:16, fontWeight:300 }}>Five automated stages from raw data to trained model</p>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:32, top:0, bottom:0, width:1, background:'rgba(255,255,255,0.06)' }} />
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} ref={el => refs.current[i] = el}
              style={{
                display:'flex', gap:24, marginBottom:40, transition:'all 0.7s ease',
                opacity: visible.includes(i) ? 1 : 0,
                transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-28px)',
              }}>
              <div style={{
                width:64, height:64, borderRadius:'50%', flexShrink:0, zIndex:1,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'rgba(255,255,255,0.02)',
                border:'1px solid rgba(199,159,151,0.2)',
                boxShadow:'0 4px 20px rgba(147,104,104,0.15)',
              }}>
                <Icon size={24} color="#C79F97" strokeWidth={1.5} />
              </div>
              <div style={{ paddingTop:12, background:'rgba(255,255,255,0.02)', borderRadius:12, padding:'14px 18px', flex:1, border:'0.5px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:6, color:'#FFFFFF' }}>{s.title}</h3>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, lineHeight:1.65, fontWeight:300 }}>{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
