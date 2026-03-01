'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface BoundaryProps {
  children: ReactNode;
  message?: string;
}

interface BoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary defensivo que evita que una excepción en un widget
 * derribe toda la aplicación. Muestra un fallback compacto por defecto.
 */
export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary atrapó un error:', error, info.componentStack);
  }

  render() {
    const { hasError } = this.state;
    const { children, message = 'Error al cargar este componente.' } = this.props;

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-sm text-red-500 border border-red-200 rounded-xl bg-red-50">
          {message}
        </div>
      );
    }

    return children;
  }
}

export function ComponentErrorBoundary({ children, message }: BoundaryProps) {
  return (
    <ErrorBoundary message={message}>{children}</ErrorBoundary>
  );
}
