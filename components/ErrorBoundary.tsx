'use client';

import { Component, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
    toast.error('An error occurred while rendering the component');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-600">
          Something went wrong. Please try again or contact support.
        </div>
      );
    }
    return this.props.children;
  }
}