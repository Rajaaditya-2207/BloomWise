import React from 'react';
import { ColoredProjectLogo } from './Icons';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'var(--bg-primary, #f9fafb)',
                    color: 'var(--text-primary, #111827)',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{ marginBottom: '20px', animation: 'bounce 2s infinite' }}>
                        <ColoredProjectLogo width="64" height="64" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', fontWeight: 'bold' }}>Something went wrong</h2>
                    <p style={{ marginBottom: '20px', color: 'var(--text-secondary, #6b7280)', maxWidth: '400px' }}>
                        We're sorry, but the application encountered an unexpected error. Please try reloading the page.
                    </p>
                    {this.state.error && (
                        <div style={{
                            textAlign: 'left',
                            background: 'rgba(255, 0, 0, 0.05)',
                            border: '1px solid rgba(255, 0, 0, 0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '25px',
                            maxWidth: '500px',
                            width: '100%',
                            overflow: 'auto',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            color: '#ef4444'
                        }}>
                            <strong>Error:</strong> {this.state.error.toString()}
                        </div>
                    )}
                    <button
                        onClick={this.handleReload}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'var(--accent-primary, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Reload Application
                    </button>
                    <style>{`
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
          `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
