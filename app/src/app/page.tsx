import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Target, Users, DollarSign, Smartphone, Trophy, Calendar, BarChart3, Building2 } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#002418]">
      {/* Header */}
      <header className="border-b border-[#004d35]">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c9a962] text-[#002418] font-bold">
              F
            </div>
            <span className="text-xl font-bold text-[#e8f5f0]">Fore</span>
          </div>
          <Link href="/auth">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#e8f5f0] sm:text-5xl md:text-6xl">
            Run your golf leagues.{' '}
            <span className="text-[#c9a962]">Effortlessly.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#a8d4c0]">
            The complete platform for golf courses to manage leagues and outings,
            and for players to track tournaments with friends.
            Live scoring, automatic leaderboards, and instant settlements.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a]">
                Get Started Free
              </Button>
            </Link>
            <Link href="#for-courses">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962] hover:text-[#002418]">
                For Golf Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Golf Courses */}
      <section className="bg-[#003d2a] py-20" id="for-courses">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#004d35] px-4 py-1 text-sm font-medium text-[#c9a962] mb-4">
              <Building2 className="h-4 w-4" />
              For Golf Courses
            </div>
            <h2 className="text-3xl font-bold text-[#e8f5f0]">
              Manage Leagues & Outings Like a Pro
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#a8d4c0]">
              Stop juggling spreadsheets. Fore handles registration, scoring, leaderboards,
              and payouts so you can focus on running your course.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Calendar className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                League Management
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Set up weekly leagues with automatic scheduling, handicap tracking, and season-long standings.
              </p>
            </div>

            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Trophy className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Outing Coordination
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Corporate outings, charity events, member tournaments. One platform handles it all.
              </p>
            </div>

            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <BarChart3 className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Live Leaderboards
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Real-time scoring updates displayed on TVs in the clubhouse or on players&apos; phones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Players */}
      <section className="py-20 bg-[#002418]" id="for-players">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#004d35] px-4 py-1 text-sm font-medium text-[#c9a962] mb-4">
              <Users className="h-4 w-4" />
              For Players
            </div>
            <h2 className="text-3xl font-bold text-[#e8f5f0]">
              Track Games with Your Crew
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#a8d4c0]">
              Playing a weekend round with friends? Keep score, run side games,
              and settle up automatically. No more arguing at the 19th hole.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#003d2a] py-20" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#e8f5f0]">
            Simple. Fast. Fair.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#a8d4c0]">
            Whether you&apos;re running a 100-player outing or a casual weekend round,
            Fore makes scoring effortless.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Target className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Pick Your Format
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Stroke play, skins, nassau, match play, scramble, and more. Customize to fit your event.
              </p>
            </div>

            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Users className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Invite Players
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Send links to join. Players register, pay, and get paired automatically.
              </p>
            </div>

            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <Smartphone className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Live Scoring
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Players enter scores on their phones. Leaderboards update in real-time.
              </p>
            </div>

            <div className="rounded-xl bg-[#002418] p-6 border border-[#004d35]">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#004d35]">
                <DollarSign className="h-6 w-6 text-[#c9a962]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#e8f5f0]">
                Instant Results
              </h3>
              <p className="mt-2 text-[#a8d4c0]">
                Automatic calculation of winners, prizes, and settlements. No spreadsheets needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Formats */}
      <section className="py-20 bg-[#002418]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#e8f5f0]">
            Every Format You Need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#a8d4c0]">
            From weekly leagues to corporate scrambles, we support all the popular formats.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border-2 border-[#004d35] p-6 hover:border-[#c9a962] transition-colors bg-[#003d2a]">
              <h3 className="text-xl font-bold text-[#e8f5f0]">Stroke Play</h3>
              <p className="mt-2 text-[#a8d4c0]">
                Total strokes count. Gross or net with handicaps.
              </p>
              <div className="mt-4 text-sm font-medium text-[#c9a962]">
                Leagues & Tournaments
              </div>
            </div>

            <div className="rounded-xl border-2 border-[#004d35] p-6 hover:border-[#c9a962] transition-colors bg-[#003d2a]">
              <h3 className="text-xl font-bold text-[#e8f5f0]">Scramble</h3>
              <p className="mt-2 text-[#a8d4c0]">
                Team format where everyone plays from the best shot.
              </p>
              <div className="mt-4 text-sm font-medium text-[#c9a962]">
                Outings & Charity Events
              </div>
            </div>

            <div className="rounded-xl border-2 border-[#004d35] p-6 hover:border-[#c9a962] transition-colors bg-[#003d2a]">
              <h3 className="text-xl font-bold text-[#e8f5f0]">Skins</h3>
              <p className="mt-2 text-[#a8d4c0]">
                Win the hole outright, win the skin. Ties carry over.
              </p>
              <div className="mt-4 text-sm font-medium text-[#c9a962]">
                Casual Games
              </div>
            </div>

            <div className="rounded-xl border-2 border-[#004d35] p-6 hover:border-[#c9a962] transition-colors bg-[#003d2a]">
              <h3 className="text-xl font-bold text-[#e8f5f0]">Nassau</h3>
              <p className="mt-2 text-[#a8d4c0]">
                Three bets: front 9, back 9, and overall match.
              </p>
              <div className="mt-4 text-sm font-medium text-[#c9a962]">
                Classic Wagering
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#004d35] py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#e8f5f0]">
            Ready to run your next event?
          </h2>
          <p className="mt-4 text-lg text-[#a8d4c0]">
            Set up your first league or game in minutes. Free to get started.
          </p>
          <Link href="/auth" className="mt-8 inline-block">
            <Button
              size="lg"
              className="bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a]"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#004d35] py-8 bg-[#002418]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#c9a962] text-[#002418] text-sm font-bold">
                F
              </div>
              <span className="text-sm font-medium text-[#a8d4c0]">
                Fore - Golf Leagues & Scoring Made Simple
              </span>
            </div>
            <p className="text-sm text-[#a8d4c0]">
              For courses, leagues, and players who love the game.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
