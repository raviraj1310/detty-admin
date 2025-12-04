import ItineraryForm from '@/components/users/ItineraryForm';

export default function ItineraryPage() {
  return (
    <div className="min-h-full bg-[#F4F6FB] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full  flex-col gap-6">
        <header className="pt-2">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Profile - Oluwatobi Hassan
          </h1>
          <nav className="mt-1 text-sm text-[#A4ABC3]">
            Dashboard <span className="mx-1 text-[#CCD1E4]">/</span> Users
          </nav>
        </header>

        <div className="rounded-[34px] border border-[#E1E6F7] bg-gradient-to-br from-white via-[#F7F8FF] to-[#EEF2FF] p-1 shadow-[0_32px_70px_-48px_rgba(15,23,42,0.5)]">
          <div className="rounded-[30px] border border-white/80 bg-white shadow-[0_26px_60px_-42px_rgba(15,23,42,0.55)]">
            <ItineraryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
