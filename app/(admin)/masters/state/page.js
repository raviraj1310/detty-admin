import StateMaster from "@/components/masters/StateMaster";

export default function StateMasterPage() {
  return (
    <div className="min-h-full bg-[#F4F6FB]">
      <div className="mx-auto w-full">
        <div className="rounded-[34px] border border-[#E1E6F7] bg-gradient-to-br from-white via-[#F7F8FF] to-[#EEF2FF] p-1 shadow-[0_32px_70px_-48px_rgba(15,23,42,0.5)]">
          <div className="rounded-[30px] border border-white/80 bg-white shadow-[0_26px_60px_-42px_rgba(15,23,42,0.55)]">
            <div className="p-6 sm:p-2 lg:p-4">
              <StateMaster />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
