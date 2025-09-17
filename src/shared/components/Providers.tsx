"use client";

import React from "react";
import ConvexClientProvider from "./ConvexClientProvider";
import { ThemeProvider } from "./ThemeProvider";
import AuthGate from "@/features/auth/components/auth-gate";

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <ConvexClientProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthGate>{children}</AuthGate>
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
