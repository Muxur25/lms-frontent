
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoon() {

  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: 24
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        border: '1px solid var(--border-2)'
      }}>
        <Construction size={40} color="var(--blue-400)" />
      </div>
      
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Sahifa tez orada ishga tushadi</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
        Bu funksionallik (Yangi kurs, imtihon yoki vebinar yaratish) hozirda ishlab chiqish bosqichida. 
        Tez kunda platformaga qo'shiladi!
      </p>

      <button className="btn btn-secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Ortga qaytish
      </button>
    </div>
  );
}
