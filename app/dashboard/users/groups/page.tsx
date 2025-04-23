'use client';

import { useEffect, useState } from 'react';
import { Card } from '@tremor/react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

interface UserGroup {
  id: string;
  name: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/users/groups');
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/users/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: groupName }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([...groups, newGroup]);
        setShowNewGroupModal(false);
        setGroupName('');
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/users/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: groupName }),
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        setGroups(groups.map(g => g.id === groupId ? updatedGroup : g));
        setEditingGroup(null);
        setGroupName('');
      }
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGroups(groups.filter(g => g.id !== groupId));
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Groups</h1>
          <p className="text-sm text-muted-foreground">
            Organize users into groups for easier management
          </p>
        </div>
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </button>
      </div>

      <div className="grid gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {group.users.length} members
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingGroup(group);
                    setGroupName(group.name);
                  }}
                  className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {group.users.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <ul className="space-y-2">
                  {group.users.map((user) => (
                    <li key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-medium mb-4">Create New Group</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter group name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowNewGroupModal(false);
                    setGroupName('');
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium bg-background hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-lg font-medium mb-4">Edit Group</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter group name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupName('');
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium bg-background hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateGroup(editingGroup.id)}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}