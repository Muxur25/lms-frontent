import { BookOpen, FileText, Download, Eye, Search, Filter } from 'lucide-react';

export default function Library() {
  const docs = [
    { id: 1, title: 'Texnika xavfsizligi qoidalari', type: 'PDF', size: '2.4 MB', date: '12 May, 2026', views: 1240 },
    { id: 2, title: 'Kombinat yillik hisoboti 2025', type: 'PDF', size: '5.1 MB', date: '05 May, 2026', views: 890 },
    { id: 3, title: 'Yangi ishchilarni o\'qitish qo\'llanmasi', type: 'DOCX', size: '1.2 MB', date: '01 May, 2026', views: 3200 },
    { id: 4, title: 'ISO 9001 Standartlari', type: 'PDF', size: '3.8 MB', date: '28 Apr, 2026', views: 450 },
    { id: 5, title: 'Favqulodda vaziyatlar yo\'riqnomasi', type: 'PDF', size: '1.5 MB', date: '15 Apr, 2026', views: 5600 },
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen color="var(--cyan-400)" size={24} />
            Korporativ Kutubxona
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Barcha o'quv materiallari, qoidalar va hujjatlar</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 16, display: 'flex', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </div>
          <input type="text" className="input" style={{ paddingLeft: 40, width: '100%' }} placeholder="Hujjat nomi yoki mavzusi bo'yicha qidirish..." />
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} /> Filtrlar
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border-1)', textAlign: 'left' }}>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hujjat nomi</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Format / Hajm</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yuklangan sana</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ko'rishlar</th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Harakatlar</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, idx) => (
                <tr key={doc.id} style={{ borderBottom: idx !== docs.length - 1 ? '1px solid var(--border-1)' : 'none', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.1)', color: 'var(--cyan-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{doc.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className="badge badge-blue" style={{ marginBottom: 6, display: 'inline-block' }}>{doc.type}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{doc.size}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>{doc.date}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>{doc.views} marta</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-icon btn-ghost" title="O'qish"><Eye size={16} /></button>
                      <button className="btn btn-icon btn-ghost" title="Yuklab olish"><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
