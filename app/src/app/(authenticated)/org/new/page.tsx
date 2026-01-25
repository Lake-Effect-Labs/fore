'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createOrganization } from '@/lib/actions';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await createOrganization({
      name,
      phone: phone || undefined,
      email: email || undefined,
      address_line1: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip_code: zipCode || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.organization) {
      router.push(`/org/${result.organization.slug}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#e8f5f0]">
          Register Your Golf Course
        </h1>
        <p className="mt-2 text-[#a8d4c0]">
          Set up your course to manage leagues, events, and players.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#004d35]">
              <Building2 className="h-5 w-5 text-[#c9a962]" />
            </div>
            <div>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Basic details about your golf course</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#e8f5f0]">
                Course Name *
              </label>
              <Input
                className="mt-2"
                placeholder="Pine Valley Golf Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0]">
                  Phone
                </label>
                <Input
                  className="mt-2"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0]">
                  Email
                </label>
                <Input
                  className="mt-2"
                  type="email"
                  placeholder="proshop@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8f5f0]">
                Address
              </label>
              <Input
                className="mt-2"
                placeholder="123 Fairway Drive"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0]">
                  City
                </label>
                <Input
                  className="mt-2"
                  placeholder="Pine Valley"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0]">
                  State
                </label>
                <Input
                  className="mt-2"
                  placeholder="NJ"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#e8f5f0]">
                  ZIP Code
                </label>
                <Input
                  className="mt-2"
                  placeholder="08021"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create Golf Course
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
