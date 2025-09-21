import AuthSwitcher from "@/app/sign-in/components/AuthSwitcher";

export default function SignInPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-2 space-y-4">
        <AuthSwitcher />
      </div>
    </div>
  );
}
