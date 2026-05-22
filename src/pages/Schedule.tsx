import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

export default function Schedule() {
  const events = [
    { time: '09:00', title: 'Kundalik yig\'ilish', type: 'Majlis', location: 'Majlislar zali 2' },
    { time: '11:30', title: 'Sanoat xavfsizligi bo\'yicha attestatsiya', type: 'Imtihon', location: 'Kompyuter xonasi (3-qavat)' },
    { time: '14:00', title: 'Ochiq konlarni qazish vebinari', type: 'Vebinar', location: 'Onlayn (Teams)' },
    { time: '16:00', title: 'Texnik uskunalar nazorati', type: 'Amaliyot', location: 'Asosiy tsex' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon color="var(--green-400)" size={24} />
            Shaxsiy Jadval
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Sizning darslaringiz, imtihonlaringiz va tadbirlaringiz</p>
        </div>
      </div>

      <div className="grid grid-12">
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Bugungi tadbirlar (21 May)</h3>
          
          <div style={{ position: 'relative', borderLeft: '2px solid var(--border-2)', marginLeft: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {events.map((ev, i) => (
                <div key={i} style={{ position: 'relative', paddingLeft: 24 }}>
                  <span style={{ 
                    position: 'absolute', left: -9, top: 4, width: 16, height: 16, 
                    borderRadius: '50%', border: '4px solid var(--bg-2)', background: 'var(--green-500)' 
                  }} />
                  
                  <div style={{ 
                    background: 'var(--surface-1)', border: '1px solid var(--border-1)', 
                    borderRadius: 'var(--radius-lg)', padding: 16, transition: 'background 0.2s' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h4 style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{ev.title}</h4>
                      <span className="badge badge-green">{ev.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {ev.time}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {ev.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-primary)' }}>Kalendar vizualizatsiyasi</h3>
          <div style={{ 
            background: 'var(--surface-1)', borderRadius: 'var(--radius-xl)', height: 300, 
            border: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'var(--text-muted)' 
          }}>
            Mini Kalendar vidjeti bu yerda bo'ladi
          </div>
        </div>
      </div>
    </div>
  );
}
