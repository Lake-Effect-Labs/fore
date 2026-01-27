export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#004d35] border-t-[#c9a962]" />
      <p className="mt-4 text-[#a8d4c0]">Loading...</p>
    </div>
  );
}
