export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-4xl md:text-6xl font-bold text-primary mb-4">
          Smart Gym Management System
        </h1>

        <p className="text-lg md:text-xl text-secondary max-w-2xl mb-8">
          Manage memberships, attendance, billing, and fitness progress with
          a premium modern dashboard designed for gyms and fitness studios.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/login" className="px-8 py-4 bg-primary text-white rounded-xl text-lg font-semibold shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-200">
            Login to Dashboard
          </a>
          <a href="#features" className="px-8 py-4 bg-white text-secondary border-2 border-secondary/10 rounded-xl text-lg font-semibold hover:bg-gray-50 transition">
            View Features
          </a>
        </div>
      </div>
    </div>
  );
}
