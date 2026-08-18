import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// --- Mocks ---
const mockErrors = { current: [] as Array<{ id: string; question_id: string; created_at: string }> };
const mockQuestions = { current: [] as any[] };
const listeners = new Set<() => void>();

const triggerRefetch = () => listeners.forEach((l) => l());

vi.mock("@/hooks/useUserErrors", () => ({
  ERROR_REVIEW_BONUS: 50,
  useUserErrors: () => ({
    errors: mockErrors.current,
    pendingCount: mockErrors.current.length,
    isLoading: false,
    clearError: vi.fn(async (qid: string) => {
      mockErrors.current = mockErrors.current.filter((e) => e.question_id !== qid);
      mockQuestions.current = mockQuestions.current.filter((q) => q.id !== qid);
      triggerRefetch();
    }),
    grantQueueCompletionBonus: vi.fn(async () => 50),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: mockQuestions.current, error: null }),
        eq: async () => ({ data: [], error: null }),
      }),
    }),
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  },
}));

vi.mock("@/components/AITutorDialog", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ErrorReview from "@/pages/ErrorReview";
import { useQueryClient } from "@tanstack/react-query";

const makeQ = (id: string, text: string) => ({
  id,
  question_text: text,
  options: ["A", "B", "C", "D"],
  correct_answer: 0,
  explanation: "",
  difficulty: 1,
});

const Harness = () => {
  const qc = useQueryClient();
  listeners.add(() => qc.invalidateQueries({ queryKey: ["error-review-questions"] }));
  return <ErrorReview />;
};

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ErrorReview refetch bounds", () => {
  beforeEach(() => {
    listeners.clear();
    mockErrors.current = [
      { id: "e1", question_id: "q1", created_at: "" },
      { id: "e2", question_id: "q2", created_at: "" },
    ];
    mockQuestions.current = [makeQ("q1", "Question one?"), makeQ("q2", "Question two?")];
  });

  it("does not crash when questions refetch shrinks the list mid-review", async () => {
    renderPage();

    // Wait for first question to render
    await waitFor(() => {
      expect(
        screen.getByText(/Question one\?|Question two\?/)
      ).toBeInTheDocument();
    });

    // Simulate the exact bug scenario: clearError removes q1, refetch returns
    // a shorter questions array. Previously `shuffled[index]` became undefined
    // and `question.options` threw a TypeError.
    await act(async () => {
      mockErrors.current = [{ id: "e2", question_id: "q2", created_at: "" }];
      mockQuestions.current = [makeQ("q2", "Question two?")];
      triggerRefetch();
    });

    // Component should still be alive — no ErrorBoundary fallback, no crash.
    await waitFor(() => {
      expect(screen.queryByText(/Something drifted off-track/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Question two\?/)).toBeInTheDocument();
    });
  });

  it("clears to the empty state without crashing when the last error is cleared", async () => {
    mockErrors.current = [{ id: "e1", question_id: "q1", created_at: "" }];
    mockQuestions.current = [makeQ("q1", "Only question?")];
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Only question\?/)).toBeInTheDocument();
    });

    await act(async () => {
      mockErrors.current = [];
      mockQuestions.current = [];
      triggerRefetch();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Something drifted off-track/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Clean Slate/i)).toBeInTheDocument();
    });
  });
});
