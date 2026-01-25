'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  getOrganization,
  getOrganizationMembers,
  getUserRole,
  addOrganizationMember,
  removeOrganizationMember,
  searchUserByEmail,
  updateMemberRole,
} from '@/lib/actions';
import type { Organization, OrganizationMember, OrgRole } from '@/types/b2b';
import {
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  Trash2,
  Shield,
  Crown,
  Store,
  User,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

type MemberWithProfile = OrganizationMember & {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

const roleIcons: Record<OrgRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  pro_shop: <Store className="h-4 w-4" />,
  member: <User className="h-4 w-4" />,
};

const roleLabels: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  pro_shop: 'Pro Shop',
  member: 'Member',
};

const roleBadgeVariants: Record<OrgRole, 'default' | 'secondary' | 'success' | 'warning'> = {
  owner: 'warning',
  admin: 'success',
  pro_shop: 'default',
  member: 'secondary',
};

export default function TeamManagementPage({ params }: PageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [slug, setSlug] = useState<string>('');
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add member state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrgRole>('member');
  const [isAdding, setIsAdding] = useState(false);

  // Role editing state
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const resolvedParams = await params;
        setSlug(resolvedParams.slug);

        const organization = await getOrganization(resolvedParams.slug);
        if (!organization) {
          router.push('/admin');
          return;
        }
        setOrg(organization);

        const role = await getUserRole(organization.id);
        if (!role || !['owner', 'admin'].includes(role)) {
          router.push(`/admin/${resolvedParams.slug}`);
          return;
        }
        setUserRole(role);

        const membersList = await getOrganizationMembers(organization.id);
        setMembers(membersList);
      } catch (err) {
        setError('Failed to load team data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params, router]);

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const user = await searchUserByEmail(searchEmail);
      if (!user) {
        setSearchError('No user found with this email');
        return;
      }

      // Check if already a member
      const isAlreadyMember = members.some(m => m.user_id === user.id);
      if (isAlreadyMember) {
        setSearchError('This user is already a member');
        return;
      }

      setSearchResult(user);
    } catch (err) {
      setSearchError('Failed to search for user');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!searchResult || !org) return;

    setIsAdding(true);
    try {
      const result = await addOrganizationMember(org.id, searchResult.id, selectedRole);
      if (result.error) {
        setSearchError(result.error);
        return;
      }

      // Refresh members list
      const updatedMembers = await getOrganizationMembers(org.id);
      setMembers(updatedMembers);

      // Reset form
      setSearchEmail('');
      setSearchResult(null);
      setSelectedRole('member');
    } catch (err) {
      setSearchError('Failed to add member');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = async (memberId: string, userId: string, newRole: OrgRole) => {
    if (!org) return;

    startTransition(async () => {
      try {
        const result = await updateMemberRole(org.id, userId, newRole);
        if (result.error) {
          setError(result.error);
          return;
        }

        // Update local state
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
        setEditingMemberId(null);
      } catch (err) {
        setError('Failed to update role');
        console.error(err);
      }
    });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!org) return;

    startTransition(async () => {
      try {
        const result = await removeOrganizationMember(org.id, userId);
        if (result.error) {
          setError(result.error);
          return;
        }

        // Update local state
        setMembers(prev => prev.filter(m => m.user_id !== userId));
        setDeletingMemberId(null);
      } catch (err) {
        setError('Failed to remove member');
        console.error(err);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#002418]">
        <div className="text-[#a8d4c0]">Loading...</div>
      </div>
    );
  }

  if (!org || !userRole) {
    return null;
  }

  const isOwner = userRole === 'owner';

  return (
    <div className="min-h-screen bg-[#002418]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/admin/${slug}`}
          className="mb-6 inline-flex items-center text-sm text-[#a8d4c0] hover:text-[#e8f5f0] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {org.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004d35]">
              <Users className="h-6 w-6 text-[#c9a962]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#e8f5f0]">Team Management</h1>
              <p className="text-[#a8d4c0]">{org.name}</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-300 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add Member Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#c9a962]" />
              Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Search by email address..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  />
                </div>
                <Button
                  onClick={handleSearchUser}
                  isLoading={isSearching}
                  variant="secondary"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchError && (
                <p className="text-sm text-red-400">{searchError}</p>
              )}

              {searchResult && (
                <div className="rounded-lg border border-[#004d35] bg-[#003d2a] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={searchResult.avatar_url}
                        name={searchResult.full_name}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-[#e8f5f0]">
                          {searchResult.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-[#a8d4c0]">{searchResult.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchResult(null)}
                      className="p-1 text-[#a8d4c0] hover:text-[#e8f5f0]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-sm text-[#a8d4c0] mb-1">Role</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as OrgRole)}
                        className="w-full h-11 rounded-lg border-2 border-[#004d35] bg-[#002418] px-4 py-2 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="pro_shop">Pro Shop</option>
                        {isOwner && <option value="admin">Admin</option>}
                      </select>
                    </div>
                    <div className="pt-6">
                      <Button
                        onClick={handleAddMember}
                        isLoading={isAdding}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#c9a962]" />
                Team Members
              </span>
              <Badge variant="secondary">{members.length} members</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center py-8 text-[#a8d4c0]">
                No team members yet.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const isEditing = editingMemberId === member.id;
                  const isDeleting = deletingMemberId === member.id;
                  const canEdit = member.role !== 'owner' && (isOwner || (userRole === 'admin' && member.role !== 'admin'));
                  const canDelete = member.role !== 'owner';

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-[#004d35] bg-[#003d2a]/50 p-4 transition-colors hover:bg-[#003d2a]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.profile.avatar_url}
                          name={member.profile.full_name}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-[#e8f5f0]">
                            {member.profile.full_name || 'No name'}
                          </p>
                          <p className="text-sm text-[#a8d4c0]">
                            {member.profile.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={member.role}
                              onChange={(e) => handleUpdateRole(member.id, member.user_id, e.target.value as OrgRole)}
                              disabled={isPending}
                              className="h-9 rounded-lg border border-[#004d35] bg-[#002418] px-3 text-sm text-[#e8f5f0] focus:border-[#c9a962] focus:outline-none"
                            >
                              <option value="member">Member</option>
                              <option value="pro_shop">Pro Shop</option>
                              {isOwner && <option value="admin">Admin</option>}
                            </select>
                            <button
                              onClick={() => setEditingMemberId(null)}
                              className="p-2 text-[#a8d4c0] hover:text-[#e8f5f0]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : isDeleting ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-400">Confirm remove?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user_id)}
                              isLoading={isPending}
                            >
                              Yes
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingMemberId(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant={roleBadgeVariants[member.role]}>
                              <span className="flex items-center gap-1">
                                {roleIcons[member.role]}
                                {roleLabels[member.role]}
                              </span>
                            </Badge>

                            {canEdit && (
                              <button
                                onClick={() => setEditingMemberId(member.id)}
                                className="p-2 text-[#a8d4c0] hover:text-[#c9a962] transition-colors"
                                title="Change role"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => setDeletingMemberId(member.id)}
                                className="p-2 text-[#a8d4c0] hover:text-red-400 transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role descriptions */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-[#a8d4c0] mb-3">Role Permissions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#004d35] bg-[#003d2a]/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-[#c9a962]" />
                <span className="font-medium text-[#e8f5f0]">Owner</span>
              </div>
              <p className="text-sm text-[#a8d4c0]">
                Full access. Can manage all settings, billing, and team members including admins.
              </p>
            </div>
            <div className="rounded-lg border border-[#004d35] bg-[#003d2a]/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="font-medium text-[#e8f5f0]">Admin</span>
              </div>
              <p className="text-sm text-[#a8d4c0]">
                Can manage leagues, events, courses, and team members (except other admins).
              </p>
            </div>
            <div className="rounded-lg border border-[#004d35] bg-[#003d2a]/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-[#c9a962]" />
                <span className="font-medium text-[#e8f5f0]">Pro Shop</span>
              </div>
              <p className="text-sm text-[#a8d4c0]">
                Can check in players, manage tee times, and view event details.
              </p>
            </div>
            <div className="rounded-lg border border-[#004d35] bg-[#003d2a]/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-[#a8d4c0]" />
                <span className="font-medium text-[#e8f5f0]">Member</span>
              </div>
              <p className="text-sm text-[#a8d4c0]">
                Basic access to view organization information and participate in events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
