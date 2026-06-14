import useProjectStore from '../store/useProjectStore';

export default function DatasetPreview() {
  const preview = useProjectStore(s => s.preview);
  const columnInfo = useProjectStore(s => s.columnInfo);
  if (!preview) return null;
  const cols = Object.keys(preview[0] || {});

  return (
    <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:14, overflowX:'auto', maxHeight:280, overflowY:'auto', fontFamily:"'Poppins',sans-serif", boxShadow:'0 2px 12px rgba(147,104,104,0.08)'}}>
      <h3 style={{fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:10}}>Dataset Preview</h3>
      <table style={{width:'100%', fontSize:11, borderCollapse:'collapse'}}>
        <thead>
          <tr>{cols.map(col => (
            <th key={col} style={{position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', padding:'6px 10px', background:'rgba(10,10,10,0.8)', color:'#FFFFFF', fontWeight:600, textAlign:'left', whiteSpace:'nowrap', borderBottom:'1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'}}>
              {col}<span style={{color:'rgba(255,255,255,0.3)', fontWeight:400, marginLeft:4}}>({columnInfo?.[col]})</span>
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {preview.slice(0, 8).map((row, i) => (
            <tr key={i} className="table-row-hover" style={{background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}}>
              {cols.map(col => <td key={col} style={{padding:'5px 10px', color:'rgba(255,255,255,0.6)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{String(row[col])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
