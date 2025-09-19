import { redirect } from "next/navigation";
import { getToken } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@/convex/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken(createAuth);
  if (!token) {
    redirect("/sign-in");
  } else {
    return children;
  }
}
