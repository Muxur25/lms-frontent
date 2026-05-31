import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Monitor, Smartphone, Tablet, X, LogOut } from 'lucide-react';

interface Device {
  sessionId: string;
  deviceId: string;
  browser: string;
  os: string;
  deviceType: string;
  lastActivity: string;
}

interface DeviceLimitModalProps {
  isOpen: boolean;
  devices: Device[];
  onDeviceRemoved: (sessionId: string) => void;
  onCancel: () => void;
}

export function DeviceLimitModal({ isOpen, devices, onDeviceRemoved, onCancel }: DeviceLimitModalProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleRemove = async (sessionId: string) => {
    setLoading(sessionId);
    // Give a small UI delay then trigger login retry with removeSessionId
    setTimeout(() => {
      onDeviceRemoved(sessionId);
      setLoading(null);
    }, 500);
  };

  const getIcon = (type: string) => {
    if (type.toLowerCase() === 'mobile') return <Smartphone className="text-blue-500" size={24} />;
    if (type.toLowerCase() === 'tablet') return <Tablet className="text-purple-500" size={24} />;
    return <Monitor className="text-emerald-500" size={24} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <ShieldAlert className="text-red-500" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Device Limit Reached</h2>
                <p className="text-sm text-gray-400 mt-1">You have reached the maximum of 3 active devices.</p>
              </div>
            </div>

            <p className="text-[15px] text-gray-300 mb-6 leading-relaxed">
              To continue logging in from this device, you must remove one of your existing active sessions below.
            </p>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {devices.map((device) => (
                <div
                  key={device.sessionId}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-2)] hover:border-red-500/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--surface-3)] rounded-lg">
                      {getIcon(device.deviceType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        {device.os} • {device.browser}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Last active: {new Date(device.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(device.sessionId)}
                    disabled={loading === device.sessionId}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    {loading === device.sessionId ? (
                      <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel Login
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
