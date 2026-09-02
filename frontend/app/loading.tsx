export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-[#ede4d0] text-[#1e1a14] px-4 sm:px-6 lg:px-8 py-10" aria-busy="true" aria-label="Loading page">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-3 w-32 rounded-full bg-[#1e1a14]/10" />
        <div className="h-14 sm:h-20 w-3/4 rounded-xl bg-[#1e1a14]/10" />
        <div className="h-4 w-1/2 rounded-full bg-[#1e1a14]/8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-64 rounded-2xl bg-[#1e1a14]/8 border-2 border-[#1e1a14]/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
