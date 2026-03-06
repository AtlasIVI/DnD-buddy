import React, { Component, ReactNode } from 'react';
import { GiDeathSkull } from 'react-icons/gi';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            minHeight: '200px',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--button-radius)',
            border: '1px solid var(--color-error)',
          }}
        >
          <GiDeathSkull 
            size={48} 
            style={{ color: 'var(--color-error)', marginBottom: '1rem' }} 
          />
          <h2 style={{ 
            fontSize: '1.25rem', 
            color: 'var(--color-error)', 
            marginBottom: '0.5rem' 
          }}>
            Une erreur est survenue
          </h2>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-text-muted)', 
            marginBottom: '1rem',
            maxWidth: '400px'
          }}>
            {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
          </p>
          <button 
            className="btn btn--primary"
            onClick={this.handleReset}
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
