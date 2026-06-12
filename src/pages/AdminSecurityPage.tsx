import { useState, useEffect } from 'react';
import { Search, ShieldAlert, MonitorOff, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';

export default function AdminSecurityPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Let's use the standard users endpoint to list users, and we can fetch sessions when expanding or just show them
      const res = await apiClient.get('/users');
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = async (userId: string) => {
    customConfirm('Are you sure you want to force logout this user from all their devices? This action cannot be undone.', async () => {
      try {
        await apiClient.post(`/admin/security/force-logout/${userId}`);
        toast.success('User has been forced logged out from all devices.');
      } catch (err) {
        toast.error('Failed to force logout');
      }
    });
  };

  const filteredUsers = users.filter(u => 
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Super Admin Security Center
          </h1>
          <p className="text-gray-400 mt-1">Manage user sessions, force logouts, and handle impersonations.</p>
        </div>
      </div>

      <div className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-1)] flex items-center justify-between bg-[var(--surface-2)]">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface-3)] text-sm text-white placeholder-gray-500 border border-[var(--border-2)] rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
              <AlertCircle size={14} /> High Security Area
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--surface-2)] shadow-sm">
                <tr className="text-gray-400">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--surface-2)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] flex items-center justify-center font-bold text-xs text-white">
                          {user.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.email || user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--surface-3)] text-gray-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{user.departmentName || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleForceLogout(user.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 border border-amber-500/20"
                        >
                          <MonitorOff size={14} /> Force Logout
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
