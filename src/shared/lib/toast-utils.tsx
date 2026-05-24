import toast from 'react-hot-toast';

export const customConfirm = (message: string, onConfirm: () => void) => {
  toast((t) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{message}</span>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => toast.dismiss(t.id)}
        >
          Bekor qilish
        </button>
        <button 
          className="btn btn-primary btn-sm" 
          style={{ background: 'var(--red-500)', borderColor: 'var(--red-500)' }}
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
        >
          Tasdiqlash
        </button>
      </div>
    </div>
  ), {
    duration: Infinity,
    position: 'top-center',
    style: { minWidth: 300, background: 'var(--bg-2)', border: '1px solid var(--border-3)' }
  });
};
