import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[var(--bg-1)] text-[var(--text-primary)] rounded-xl border border-[var(--border-1)]">
          <ShieldAlert className="w-16 h-16 text-[var(--red-500)] mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tizimda xatolik yuz berdi</h2>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
            Dasturda kutilmagan xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Sahifani yangilash
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-[var(--bg-2)] rounded-lg text-left text-xs overflow-auto max-w-full text-[var(--red-400)]">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
