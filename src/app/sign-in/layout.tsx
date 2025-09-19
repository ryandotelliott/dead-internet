import { createAuth } from "@/convex/auth";
import { getToken } from "@convex-dev/better-auth/nextjs";
import { redirect } from "next/navigation";
import React from "react";

type Props = { children: React.ReactNode };

export default async function SignInLayout({ children }: Props) {
  const token = await getToken(createAuth);

  if (token) {
    redirect("/");
  }

  return children;
}
