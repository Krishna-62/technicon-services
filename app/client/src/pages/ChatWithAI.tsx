import AskTechnicon from '../components/AskTechnicon';

export default function ChatWithAI() {
  return (
    <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      <div className="flex flex-col gap-1.5">
        <h1 className="margin-0 text-[34px] font-medium tracking-[-.02em] leading-[1.05]">
          Chat with AI
        </h1>
        <p className="margin-0 text-[13.5px] text-[#A5AEA8]">
          Ask questions against your live Technicon data. Read-only.
        </p>
      </div>

      <AskTechnicon />
    </div>
  );
}
