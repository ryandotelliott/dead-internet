import AuthTabs from "@/app/sign-in/components/AuthTabs";

export default function SignInPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4">
        <AuthTabs />
      </div>
    </div>
  );
}
