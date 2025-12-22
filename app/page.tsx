import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BarChart3, Users, Smartphone, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">SF</div>
            SmartFit
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium hover:bg-primary/5 hover:text-primary">Log in</Button>
            </Link>
            <Link href="/login">
              <Button className="font-medium shadow-lg shadow-primary/20 rounded-full px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            v2.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent pb-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            The Operating System for <br className="hidden md:block" /> Modern Fitness Studios
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Streamline operations, boost member retention, and scale your gym with our intelligent management platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/5">
                Book Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof (Mock) */}
      <section className="py-10 border-y border-border/40 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Equinox', 'Gold\'s Gym', 'Anytime Fitness', 'Crunch', 'Orangetheory'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-bold">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to run your gym</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From member check-ins to automated billing, we've got you covered.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Member Management",
                desc: "360-degree view of your members. Track attendance, progress, and interactions in one place.",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              {
                icon: Smartphone,
                title: "Branded Mobile App",
                desc: "Give members a premium experience with a white-labeled mobile app for bookings and workouts.",
                color: "text-purple-500",
                bg: "bg-purple-50"
              },
              {
                icon: BarChart3,
                title: "Analytics & Insights",
                desc: "Real-time dashboards for revenue, retention, and growth metrics to make data-driven decisions.",
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              },
              {
                icon: ShieldCheck,
                title: "Access Control",
                desc: "Seamless integration with biometric and QR access systems for automated 24/7 entry.",
                color: "text-orange-500",
                bg: "bg-orange-50"
              },
              {
                icon: Zap,
                title: "Automated Billing",
                desc: "Set and forget payments. Handle subscriptions, point-of-sale, and inventory effortlessly.",
                color: "text-rose-500",
                bg: "bg-rose-50"
              },
              {
                icon: CheckCircle2,
                title: "Class Scheduling",
                desc: "Dynamic calendar for group classes, personal training, and resource booking.",
                color: "text-cyan-500",
                bg: "bg-cyan-50"
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 group bg-card">
                <div className={`h-14 w-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-secondary skew-y-3 origin-bottom-right transform scale-110 z-0"></div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your fitness business?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 1,000+ gyms using SmartFit to drive growth and deliver exceptional member experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full bg-white text-secondary hover:bg-blue-50">
                Get Started Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-blue-400 text-blue-100 hover:bg-blue-900/50 hover:text-white hover:border-white">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-slate-50 text-sm md:text-base">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-700">
            <div className="h-6 w-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs">SF</div>
            SmartFit
          </div>
          <div className="text-muted-foreground text-center md:text-right">
            &copy; {new Date().getFullYear()} SmartFit Systems. All rights reserved. <br className="md:hidden" />
            Designed with <span className="text-red-500">♥</span> for the fitness community.
          </div>
        </div>
      </footer>
    </div>
  );
}
