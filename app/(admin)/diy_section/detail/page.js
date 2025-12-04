import DIYDetail from "@/components/diy/DIYDetail";

export default function DIYDetailPage() {
    return (
        <div className="min-h-full bg-[#F4F6FB]">
            <div className="mx-auto w-full">
                <div className=" border border-[#E1E6F7] bg-gradient-to-br from-white via-[#F7F8FF] to-[#EEF2FF] p-1 ">
                    <div className="rounded-[30px] border border-white/80 bg-white ">
                        <div className="">
                            <DIYDetail />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
