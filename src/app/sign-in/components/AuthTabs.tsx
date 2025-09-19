import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

export default function AuthTabs() {
  return (
    <Tabs defaultValue="signIn" className="w-full">
      <TabsList>
        <TabsTrigger value="signIn">Sign in</TabsTrigger>
        <TabsTrigger value="signUp">Sign up</TabsTrigger>
      </TabsList>
      <TabsContent value="signIn" className="gap-y-4 flex flex-col min-h-80">
        <h1 className="text-xl font-semibold">Sign in to continue</h1>
        <SignInForm />
      </TabsContent>
      <TabsContent value="signUp" className="gap-y-4 flex flex-col min-h-80">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <SignUpForm />
      </TabsContent>
    </Tabs>
  );
}
