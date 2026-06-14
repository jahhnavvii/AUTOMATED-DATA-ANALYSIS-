import { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import api from '../services/api';
import useProjectStore from '../store/useProjectStore';

export default function UploadCard() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef();
  const setUploadResult = useProjectStore(s => s.setUploadResult);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/upload', form);
      setUploadResult(res.data);
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        border: dragging ? '2px dashed #C79F97' : '2px dashed rgba(255,255,255,0.08)',
        borderRadius:16, padding:'28px 20px', textAlign:'center', cursor:'pointer',
        background: dragging ? 'rgba(199,159,151,0.04)' : 'rgba(255,255,255,0.02)',
        transition:'all 0.2s',
        boxShadow: dragging ? '0 4px 24px rgba(147,104,104,0.20)' : 'none',
        fontFamily:"'Poppins',sans-serif",
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current.click()}
    >
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
      {uploading ? (
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:500 }}>Uploading & analyzing...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <UploadCloud size={40} color={dragging ? '#E5C9C9' : '#C79F97'} strokeWidth={1.5} style={{ marginBottom: 12, transition: 'color 0.2s' }} />
          <p style={{ color:'#FFFFFF', fontWeight:600, fontSize:14 }}>{fileName || 'Drop your dataset here'}</p>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:12, marginTop:6, fontWeight:300 }}>CSV or Excel · Max 50MB</p>
        </div>
      )}
    </div>
  );
}
