'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithMagicLink, signInWithPassword, signUp } from '@/lib/actions';
import { Mail, ArrowLeft, Check, Loader2, Lock, User, Building2 } from 'lucide-react';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect');
  const errorMessage = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'player' | 'course_admin'>('player');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState(errorMessage || '');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [signInMethod, setSignInMethod] = useState<'password' | 'magic'>('password');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signInWithMagicLink(email, redirect || undefined);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsSent(true);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signInWithPassword(email, password);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Use the redirect from result (for course admins) or the URL param or dashboard
      router.push(result.redirectTo || redirect || '/dashboard');
    }
  };

  const [signUpComplete, setSignUpComplete] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signUp(email, password, accountType, fullName || undefined);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Show confirmation screen - user needs to verify email first
      setSignUpComplete(true);
    }
  };

  if (isSent) {
    return (
      <Card className="w-full max-w-md bg-[#003d2a] border-[#004d35]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#004d35]">
            <Check className="h-6 w-6 text-[#c9a962]" />
          </div>
          <CardTitle className="text-[#e8f5f0]">Check your email</CardTitle>
          <CardDescription className="text-[#a8d4c0]">
            We sent a magic link to <strong className="text-[#c9a962]">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-[#a8d4c0] mb-6">
            Click the link in your email to sign in. It may take a minute to arrive.
          </p>
          <Button
            variant="ghost"
            onClick={() => setIsSent(false)}
            className="text-[#a8d4c0] hover:text-[#e8f5f0] hover:bg-[#004d35]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sign Up Complete - Show email confirmation screen
  if (signUpComplete) {
    return (
      <Card className="w-full max-w-md bg-[#003d2a] border-[#004d35]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#004d35]">
            <Mail className="h-6 w-6 text-[#c9a962]" />
          </div>
          <CardTitle className="text-[#e8f5f0]">Verify your email</CardTitle>
          <CardDescription className="text-[#a8d4c0]">
            We sent a confirmation link to <strong className="text-[#c9a962]">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-[#a8d4c0] mb-6">
            Please check your email and click the confirmation link to activate your account.
            {accountType === 'course_admin' && (
              <span className="block mt-2">
                Once confirmed, you&apos;ll be able to set up your golf course.
              </span>
            )}
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setSignUpComplete(false);
              setAuthMode('signin');
            }}
            className="text-[#a8d4c0] hover:text-[#e8f5f0] hover:bg-[#004d35]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sign Up Form
  if (authMode === 'signup') {
    return (
      <Card className="w-full max-w-md bg-[#003d2a] border-[#004d35]">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c9a962] text-[#002418] font-bold text-lg">
              F
            </div>
          </Link>
          <CardTitle className="text-[#e8f5f0]">Create Account</CardTitle>
          <CardDescription className="text-[#a8d4c0]">
            Choose your account type to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Account Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('player')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  accountType === 'player'
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
                }`}
              >
                <User className={`h-8 w-8 ${accountType === 'player' ? 'text-[#c9a962]' : 'text-[#a8d4c0]'}`} />
                <span className={`text-sm font-medium ${accountType === 'player' ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  Player
                </span>
                <span className="text-xs text-[#a8d4c0] text-center">
                  Play games & join leagues
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('course_admin')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  accountType === 'course_admin'
                    ? 'border-[#c9a962] bg-[#004d35]'
                    : 'border-[#004d35] bg-[#002418] hover:border-[#006747]'
                }`}
              >
                <Building2 className={`h-8 w-8 ${accountType === 'course_admin' ? 'text-[#c9a962]' : 'text-[#a8d4c0]'}`} />
                <span className={`text-sm font-medium ${accountType === 'course_admin' ? 'text-[#e8f5f0]' : 'text-[#a8d4c0]'}`}>
                  Course Admin
                </span>
                <span className="text-xs text-[#a8d4c0] text-center">
                  Manage leagues & events
                </span>
              </button>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e8f5f0] mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a]" isLoading={isLoading}>
              {accountType === 'course_admin' ? 'Create Account & Register Course' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-[#a8d4c0]">Already have an account? </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
              }}
              className="text-sm text-[#c9a962] hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sign In Form
  return (
    <Card className="w-full max-w-md bg-[#003d2a] border-[#004d35]">
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c9a962] text-[#002418] font-bold text-lg">
            F
          </div>
        </Link>
        <CardTitle className="text-[#e8f5f0]">Welcome Back</CardTitle>
        <CardDescription className="text-[#a8d4c0]">
          {signInMethod === 'password' ? 'Sign in with your email and password' : 'Enter your email to get a magic link'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {signInMethod === 'password' ? (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a]" isLoading={isLoading}>
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#002418] border-[#004d35] text-[#e8f5f0] placeholder:text-[#a8d4c0]/50"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full bg-[#c9a962] text-[#002418] hover:bg-[#d4b87a]" isLoading={isLoading}>
              <Mail className="mr-2 h-4 w-4" />
              Send Magic Link
            </Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setSignInMethod(signInMethod === 'password' ? 'magic' : 'password');
              setError('');
            }}
            className="text-sm text-[#a8d4c0] hover:text-[#c9a962]"
          >
            {signInMethod === 'password' ? 'Use magic link instead' : 'Sign in with password'}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-[#004d35] text-center">
          <span className="text-sm text-[#a8d4c0]">New to Fore? </span>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setError('');
            }}
            className="text-sm text-[#c9a962] hover:underline"
          >
            Create an account
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuthLoading() {
  return (
    <Card className="w-full max-w-md bg-[#003d2a] border-[#004d35]">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a962]" />
      </CardContent>
    </Card>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#002418] px-4">
      <Suspense fallback={<AuthLoading />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
