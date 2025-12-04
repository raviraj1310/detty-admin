import LoginLeftPanel from "@/components/auth/login/LoginLeftPanel";
import LoginForm from "@/components/auth/login/LoginForm";
import LoginCard from "@/components/auth/login/LoginCard";

export default function LoginPage() {

  return (
    <div className="min-h-screen w-full bg-white dark:bg-white dark:text-slate-900 relative">
      {/* Wrapper */}
      <div className="mx-auto w-full h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Visual Panel */}
        <LoginLeftPanel />

        {/* Right: Form Panel */}
        <div className="flex items-center w-full justify-start ps-20 px-0 py-10 sm:py-14 lg:py-0">
          <LoginCard>
            {/* Header */}
            <div className="mb-8 px-6 pt-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-900">Sign In</h1>
             
            </div>

            <LoginForm />

            {/* Faint decorative vector at bottom of card
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 opacity-20">
              <img src="/images/onboarding/login_vector.webp" alt="Decorative vector" className="w-full h-full object-cover" />
            </div> */}
          </LoginCard>
        </div>
      </div>
     
  
    </div>
  );
}