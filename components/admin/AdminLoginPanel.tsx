export function AdminLoginPanel() {
  return (
    <div
      className="relative hidden min-h-screen overflow-hidden md:block"
      style={{
        backgroundImage: "url('/admin-bg.png')",
        backgroundSize: "200% auto",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#070B14]/30" />
    </div>
  );
}
