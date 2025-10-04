import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Lock, Mail, ArrowLeft, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/app/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-[#05070D] text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B1120] via-[#05070D] to-[#0A0F1A]" />
      <div className="absolute -top-40 left-20 h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-[160px]" />
      <div className="absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-sky-400/10 blur-[160px]" />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition-colors duration-200 hover:text-amber-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10">
              <Lightbulb className="h-6 w-6 text-amber-200" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">LIWANAG Portal</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Secure Access Gateway</p>
            </div>
          </div>
        </header>

        <main className="mt-12 grid flex-1 gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200">Welcome Back</p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-50">Sign in to orchestrate intelligent city lighting operations.</h1>
            <p className="max-w-lg text-base text-slate-400">
              Your LIWANAG dashboard centralizes sensor diagnostics, outage predictions, and barangay-level insights. Secure authentication protects every citizen data point.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trusted Authentication</p>
                <p className="mt-2 text-sm text-slate-200">
                  Single sign-on ready with MFA enforcement, audit trails, and role-based entitlements for LGU teams.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">24/7 Monitoring</p>
                <p className="mt-2 text-sm text-slate-200">
                  Automated health checks and alerting ensure continuous visibility across district lighting zones.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-amber-400/15 via-transparent to-blue-500/15 blur-xl" />
            <form
              onSubmit={handleSubmit}
              className="relative flex flex-col gap-6 rounded-[24px] border border-slate-700/60 bg-slate-950/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Sign in</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Access your command center</h2>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Email Address</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 focus-within:border-amber-300 focus-within:bg-slate-900/80">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@liwanag.gov.ph"
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 focus-within:border-amber-300 focus-within:bg-slate-900/80">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900/80" />
                  Remember me
                </label>
                <button type="button" className="font-semibold uppercase tracking-[0.25em] text-amber-200/80 transition-colors duration-200 hover:text-amber-200">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_40px_rgba(251,191,36,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-amber-300"
              >
                Sign in securely
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate-500">
                Need an account? <button type="button" onClick={() => navigate('/')} className="font-semibold text-amber-200 transition-colors duration-200 hover:text-amber-100">Request onboarding</button>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
