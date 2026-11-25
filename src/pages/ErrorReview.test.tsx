import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ErrorReview from "@/pages/ErrorReview";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@satango.app" },
    loading: false,
    profile: { display_name: "Test Student" },
  }),
}));

vi.mock("@/components/AITutorDialog", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/hooks/useUserErrors", () => ({
  ERROR_REVIEW_BONUS: 50,
  useUserErrors: () => ({
    errors: [],
    pendingCount: 0,
    isLoading: false,
    clearError: vi.fn(),
    grantQueueCompletionBonus: vi.fn(),
  }),
}));

describe("ErrorReview", () => {
  it("renders clean state when there are no pending errors", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ErrorReview />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Mistake Vault is Clean/i)).toBeInTheDocument();
  });
});
