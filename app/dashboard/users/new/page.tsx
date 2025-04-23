'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@tremor/react';
import Link from 'next/link';

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  extension?: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      router.push('/users');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add New User</h1>
          <p className="text-sm text-muted-foreground">
            Create a new user account
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium bg-background hover:bg-accent"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium leading-none">
                Name
              </label>
              <input
                type="text"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Email
              </label>
              <input
                type="email"
                required
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Role
              </label>
              <select
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as NewUserForm['role'] }))}
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium leading-none">
                Extension
              </label>
              <input
                type="text"
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.extension || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, extension: e.target.value }))}
                placeholder="e.g., 1001"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create User
            </button>
          </div>
        </Card>
      </form>
    </div>
  );
}