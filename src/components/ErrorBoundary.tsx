import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return <ReviewFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

const ReviewFallback = ({ onReset }: { onReset: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <span className="text-5xl block">🧭</span>
        <h1 className="text-xl font-extrabold tracking-tight">Something drifted off-track</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected snag while loading your review. Your progress is safe.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold" onClick={onReset}>
            Try again
          </Button>
          <Button className="flex-1 h-11 rounded-2xl font-bold" onClick={() => navigate("/")}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
