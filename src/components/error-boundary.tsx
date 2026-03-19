'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 py-16">
          <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
          <p className="text-lg font-medium text-neutral-200">오류가 발생했습니다</p>
          <p className="mt-1 text-sm text-neutral-500">
            {this.state.error?.message || '알 수 없는 오류'}
          </p>
          <Button
            variant="outline"
            className="mt-4 border-neutral-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
