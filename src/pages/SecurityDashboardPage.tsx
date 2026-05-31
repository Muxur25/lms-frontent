import { useState, useEffect } from 'react';
import { Shield, Monitor, Smartphone, Tablet, Clock, MapPin, AlertTriangle, KeyRound } from 'lucide-react';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';

export default function SecurityDashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [sessRes, histRes] = await Promise.all([
        apiClient.get('/security/sessions'),
        apiClient.get('/security/history')
      ]);
      setSessions(sessRes.data || []);
      setHistory(histRes.data || []);
    } catch (err) {
      console.error('Error fetching security data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSession = async (id: string) => {
    customConfirm('Are you sure you want to remove this device? You will be logged out on that device immediately.', async () => {
      try {
        await apiClient.delete(`/security/sessions/${id}`);
        setSessions(sessions.filter(s => s.id !== id));
        toast.success('Device removed successfully');
      } catch (err) {
        toast.error('Failed to remove device');
      }
    });
  };

  const handleLogoutAll = async () => {
    customConfirm('Are you sure you want to log out of ALL devices?', async () => {
      try {
        await apiClient.delete(`/security/sessions`);
        toast.success('All devices removed. You may need to log in again.');
        window.location.reload();
      } catch (err) {
        toast.error('Failed to remove all devices');
      }
    });
  };

  const getIcon = (type: string) => {
    if (type?.toLowerCase() === 'mobile') return <Smartphone size={24} className="text-blue-500" />;
    if (type?.toLowerCase() === 'tablet') return <Tablet size={24} className="text-purple-500" />;
    return <Monitor size={24} className="text-emerald-500" />;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading security data...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" /> Security Center
          </h1>
          <p className="text-gray-400 mt-1">Manage your active devices, sessions, and login history.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 flex items-center gap-2">
            <Shield size={16} />
            <span className="font-medium text-sm">Security Score: 96%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Devices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Monitor size={18} /> Active Devices ({sessions.length}/3)
            </h2>
            <button onClick={handleLogoutAll} className="text-sm text-red-400 hover:text-red-300 transition-colors">
              Log out of all devices
            </button>
          </div>

          <div className="grid gap-4">
            {sessions.map((s, idx) => (
              <div key={s.id} className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-xl p-5 flex items-center justify-between group hover:border-[var(--border-2)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--surface-2)] rounded-xl">
                    {getIcon(s.device?.deviceType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {s.device?.os} • {s.device?.browser}
                      {idx === 0 && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">THIS DEVICE</span>}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {s.device?.ipAddress}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> Last active: {new Date(s.lastActivity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {idx !== 0 && (
                  <button onClick={() => handleRemoveSession(s.id)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-[var(--surface-2)] hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border border-[var(--border-1)]">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings & Alerts */}
        <div className="space-y-6">
          <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-xl p-5">
            <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
              <KeyRound size={16} /> Account Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Two-Factor Auth</div>
                  <div className="text-xs text-gray-400 mt-0.5">Not enabled</div>
                </div>
                <button className="text-sm text-blue-400 hover:text-blue-300">Setup</button>
              </div>
              <div className="w-full h-px bg-[var(--border-1)]" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Password</div>
                  <div className="text-xs text-gray-400 mt-0.5">Last changed 2 months ago</div>
                </div>
                <button className="text-sm text-blue-400 hover:text-blue-300">Change</button>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <h2 className="font-semibold text-amber-400 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} /> Security Alerts
            </h2>
            <p className="text-sm text-amber-500/80">No suspicious activity detected in the last 30 days.</p>
          </div>
        </div>
      </div>

      {/* Login History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Login History</h2>
        <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] bg-[var(--surface-2)] text-gray-400">
                <th className="px-6 py-4 font-medium">Browser & OS</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)] text-gray-300">
              {history.slice(0, 10).map((h) => (
                <tr key={h.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {getIcon(h.deviceType)}
                    <span>{h.os} • {h.browser}</span>
                  </td>
                  <td className="px-6 py-4">{h.ipAddress}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(h.loginAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <div className="p-8 text-center text-gray-500">No login history available.</div>
          )}
        </div>
      </div>

    </div>
  );
}
