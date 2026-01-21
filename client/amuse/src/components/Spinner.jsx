export function LoadingScreen ({text}) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a] text-[#94A3B8]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FB7185] border-t-transparent rounded-full animate-spin" />
        {text}
      </div>
    </div>
  )
}