import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import MockExam from "./pages/MockExam";
import ExamCenter from "./pages/ExamCenter";
import Leaderboard from "./pages/Leaderboard";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import JumpTest from "./pages/JumpTest";
import UnitDetail from "./pages/UnitDetail";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import ErrorReview from "./pages/ErrorReview";
import Trust from "./pages/Trust";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Vocabulary from "./pages/Vocabulary";
import AdminImporter from "@/components/AdminImporter";
import AppShell from "@/components/AppShell";
import ScoreCalculator from "./pages/ScoreCalculator";
import { Battle } from "./pages/Battle";

const queryClient = new QueryClient();

const protectedRoute = (element: JSX.Element) => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/score-calculator" element={<ScoreCalculator />} />
            <Route path="/trust" element={<Trust />} />
            <Route path="/unit/:unitId" element={protectedRoute(<UnitDetail />)} />
            <Route path="/quiz/:topicId" element={protectedRoute(<Quiz />)} />
            <Route path="/battle" element={protectedRoute(<Battle />)} />
            <Route path="/jump-test/:moduleId" element={protectedRoute(<JumpTest />)} />
            <Route path="/mock-exam" element={protectedRoute(<MockExam />)} />
            <Route path="/exam-center" element={protectedRoute(<ExamCenter />)} />
            <Route path="/analytics" element={protectedRoute(<Analytics />)} />
            <Route path="/leaderboard" element={protectedRoute(<Leaderboard />)} />
            <Route path="/profile" element={protectedRoute(<Profile />)} />
            <Route path="/shop" element={protectedRoute(<Shop />)} />
            <Route path="/errors" element={protectedRoute(<ErrorReview />)} />
            <Route path="/vocabulary" element={protectedRoute(<Vocabulary />)} />
            <Route path="/admin-import" element={<ProtectedRoute adminOnly><AdminImporter /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminImporter /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
