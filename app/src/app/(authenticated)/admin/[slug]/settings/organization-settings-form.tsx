'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateOrganization } from '@/lib/actions';
import type { Organization } from '@/types/b2b';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface OrganizationSettingsFormProps {
  organization: Organization;
}

export function OrganizationSettingsForm({ organization }: OrganizationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: organization.name || '',
    description: organization.description || '',
    phone: organization.phone || '',
    email: organization.email || '',
    website: organization.website || '',
    address_line1: organization.address_line1 || '',
    address_line2: organization.address_line2 || '',
    city: organization.city || '',
    state: organization.state || '',
    zip_code: organization.zip_code || '',
    country: organization.country || 'USA',
    timezone: organization.timezone || 'America/New_York',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear message when user starts editing
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateOrganization(organization.id, {
        name: formData.name,
        description: formData.description || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country,
        timezone: formData.timezone,
      });

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: 'Organization settings updated successfully!' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Organization Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[#e8f5f0]">
          Organization Name <span className="text-red-400">*</span>
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter organization name"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-[#e8f5f0]">
          Description
        </label>
        <Input
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of your organization"
        />
      </div>

      {/* Contact Information Section */}
      <div className="border-t border-[#004d35] pt-6">
        <h3 className="mb-4 text-lg font-medium text-[#e8f5f0]">Contact Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-[#e8f5f0]">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#e8f5f0]">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@example.com"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label htmlFor="website" className="block text-sm font-medium text-[#e8f5f0]">
            Website
          </label>
          <Input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="border-t border-[#004d35] pt-6">
        <h3 className="mb-4 text-lg font-medium text-[#e8f5f0]">Address</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="address_line1" className="block text-sm font-medium text-[#e8f5f0]">
              Address Line 1
            </label>
            <Input
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address_line2" className="block text-sm font-medium text-[#e8f5f0]">
              Address Line 2
            </label>
            <Input
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Suite 100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-[#e8f5f0]">
                City
              </label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm font-medium text-[#e8f5f0]">
                State
              </label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="zip_code" className="block text-sm font-medium text-[#e8f5f0]">
                ZIP Code
              </label>
              <Input
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="12345"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-medium text-[#e8f5f0]">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="flex h-11 w-full rounded-lg border-2 border-[#004d35] bg-[#002418] px-4 py-2 text-sm text-[#e8f5f0] transition-colors focus:border-[#c9a962] focus:outline-none focus:ring-0"
              >
                <option value="USA">United States</option>
                <option value="CAN">Canada</option>
                <option value="MEX">Mexico</option>
                <option value="GBR">United Kingdom</option>
                <option value="IRL">Ireland</option>
                <option value="AUS">Australia</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="timezone" className="block text-sm font-medium text-[#e8f5f0]">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="flex h-11 w-full rounded-lg border-2 border-[#004d35] bg-[#002418] px-4 py-2 text-sm text-[#e8f5f0] transition-colors focus:border-[#c9a962] focus:outline-none focus:ring-0"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Dublin">Dublin (IST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end border-t border-[#004d35] pt-6">
        <Button type="submit" isLoading={isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
