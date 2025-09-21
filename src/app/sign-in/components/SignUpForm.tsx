"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type Props = {
  onToggle?: () => void;
  toggleLabel?: string;
};

export default function SignUpForm({ onToggle, toggleLabel }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <form
      className="flex flex-1 flex-col space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);
        try {
          const { error } = await authClient.signUp.email({
            email,
            password,
            name: name || email.split("@")[0],
          });
          if (error) {
            throw Error(error.message ?? "Failed to sign up");
          }
          router.push("/");
        } catch (err: unknown) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to sign up",
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          ref={nameRef}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
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
          autoComplete="new-password"
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
          {isSubmitting ? "Working..." : "Sign up"}
        </Button>
        {onToggle && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onToggle}
            className="px-0"
          >
            {toggleLabel ?? "Sign in"}
          </Button>
        )}
      </div>
    </form>
  );
}
