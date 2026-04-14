import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || 'Component'}] caught error:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="card" style={{ 
          border: '1px solid rgba(239, 68, 68, 0.4)', 
          background: 'rgba(239, 68, 68, 0.05)',
          padding: '24px',
          textAlign: 'center',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={32} color="#f87171" />
            <h4 style={{ margin: 0, color: '#fca5a5' }}>
              Something went wrong in {this.props.name || 'this section'}
            </h4>
            <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>
              The data might be corrupted or in an unexpected format.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="btn btn--small"
              style={{ padding: '6px 12px', fontSize: '12px', marginTop: 8 }}
            >
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
