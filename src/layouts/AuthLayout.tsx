import { Outlet } from 'react-router-dom';

/**
 * Authentication Layout
 * Minimal layout for Login, Register, Forgot Password flows.
 * Does not include Sidebar or Topbar.
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl flex items-center justify-center text-2xl font-bold text-[var(--blue-500)] mx-auto mb-4">
            L
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">AGMK LMS</h1>
          <p className="text-[var(--text-secondary)] mt-2">Enterprise Learning Platform</p>
        </div>
        
        {/* Animated Form Wrapper */}
        <div className="blur-fade">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
