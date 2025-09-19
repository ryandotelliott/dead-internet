"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="flex flex-1 flex-col space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);
        try {
          const { error } = await authClient.signIn.email({
            email,
            password,
          });
          if (error) {
            throw Error(error.message ?? "Failed to sign in");
          }
          router.push("/");
        } catch (err: unknown) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to sign in",
          );
        } finally {
          setIsSubmitting(false);
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
      {errorMessage && (
        <div className="text-sm text-red-600">{errorMessage}</div>
      )}
      <div className="flex items-center gap-2 pt-2 mt-auto">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Working..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
