"use client";

import { useMemo, useState } from "react";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const buttonText = useMemo(
    () => (mode === "signIn" ? "Sign in" : "Sign up"),
    [mode],
  );

  if (isLoading) return null;
  if (isAuthenticated) return children;

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{buttonText} to continue</h1>
          <p className="text-sm text-muted-foreground">
            Use your email and password.
          </p>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              if (mode === "signUp") {
                await authClient.signUp.email({ email, password, name: email });
              } else {
                await authClient.signIn.email({ email, password });
              }
            } catch (err: unknown) {
              setError(
                err instanceof Error ? err.message : "Authentication failed",
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Working..." : buttonText}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            >
              {mode === "signIn"
                ? "Create account"
                : "Have an account? Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
