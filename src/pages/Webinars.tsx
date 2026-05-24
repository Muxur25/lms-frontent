import { Video, Calendar, Users, PlayCircle, Clock } from 'lucide-react';

export default function Webinars() {
  const upcoming = [
    { id: 1, title: 'Ochiq konlarni qazishda xavfsizlik', speaker: 'Alisher Rahimov', date: 'Ertaga, 14:00', duration: '1.5 soat', participants: 120, img: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?auto=format&fit=crop&q=80&w=800' },
    { id: 2, title: 'Yangi uskunalar bilan ishlash bo\'yicha brifing', speaker: 'Rustam Karimov', date: '24 May, 10:00', duration: '45 daq', participants: 85, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
    { id: 3, title: 'Korporativ etika va menejment', speaker: 'Nodira To\'rayeva', date: '26 May, 16:00', duration: '1 soat', participants: 250, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800' }
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Video color="var(--blue-400)" size={24} />
            Jonli Vebinarlar
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Mutaxassislar bilan jonli darslar va brifinglar</p>
        </div>
        <button className="btn btn-primary">Yangi vebinar yaratish</button>
      </div>

      <div className="grid grid-3">
        {upcoming.map(webinar => (
          <div key={webinar.id} className="course-card">
            <div className="course-thumb" style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
              <img src={webinar.img} alt={webinar.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              <div style={{ 
                position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,0.9)', color: '#fff', 
                fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(239,68,68,1)' 
              }}>
                JONLI / REJALASHTIRILGAN
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-2), transparent)' }} />
            </div>
            <div className="course-body" style={{ padding: 20 }}>
              <h3 className="course-title" style={{ fontSize: 16, marginBottom: 8 }}>{webinar.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{webinar.speaker}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Calendar size={14} /> {webinar.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Clock size={14} /> {webinar.duration}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Users size={14} /> {webinar.participants} ishtirokchilar
                </div>
              </div>

              <div className="course-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--blue-400)', borderColor: 'var(--blue-500)' }}>
                  <PlayCircle size={16} /> Qo'shilish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
