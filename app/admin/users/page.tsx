'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Edit, Trash2, UserPlus, Download, Eye, Clock, CheckSquare, XSquare } from 'lucide-react'
import type { AdminUser } from '@/types/admin'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userActivity, setUserActivity] = useState<Record<string, any[]>>({})

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadUsers()
    setupSSE()
  }, [page, roleFilter, debouncedSearch])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupSSE = () => {
    const eventSource = new EventSource('/api/admin/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (['user_created', 'user_updated'].includes(data.type)) {
          loadUsers()
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setShowEditDialog(true)
  }

  const handleSave = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setShowEditDialog(false)
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      loadUsers()
    } catch (err: any) {
      alert(`Error deactivating user: ${err.message}`)
    }
  }

  const handleView = async (user: AdminUser) => {
    setViewingUser(user)
    setShowViewDialog(true)
    // Load user activity
    loadUserActivity(user.id)
  }

  const loadUserActivity = async (userId: string) => {
    try {
      // Fetch user's answers if they're a contributor
      const user = users.find(u => u.id === userId)
      const activity: any[] = []
      
      if (user?.role === 'contributor') {
        try {
          const answersRes = await fetch(`/api/admin/answers?contributor_id=${userId}&limit=10`)
          const answersData = await answersRes.json()
          if (answersData.success && answersData.answers) {
            activity.push(...answersData.answers.map((a: any) => ({
              type: 'answer_submitted',
              timestamp: a.created_at,
              data: { answer_text: a.answer_text, question_content: a.question_content },
            })))
          }
        } catch (err) {
          console.error('Error loading answers:', err)
        }
      }
      
      if (user?.role === 'client_owner' || user?.role === 'client_user') {
        try {
          const questionsRes = await fetch(`/api/admin/questions?page=1&limit=10`)
          const questionsData = await questionsRes.json()
          if (questionsData.success && questionsData.questions) {
            const userQuestions = questionsData.questions.filter((q: any) => q.company_id === userId)
            activity.push(...userQuestions.map((q: any) => ({
              type: 'question_created',
              timestamp: q.created_at,
              data: { content: q.content },
            })))
          }
        } catch (err) {
          console.error('Error loading questions:', err)
        }
      }
      
      const sortedActivity = activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setUserActivity(prev => ({ ...prev, [userId]: sortedActivity }))
    } catch (err) {
      console.error('Error loading user activity:', err)
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(userId)
      } else {
        newSet.delete(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return
    if (!confirm(`Are you sure you want to deactivate ${selectedUsers.size} user(s)?`)) return

    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      )
      await Promise.all(promises)
      setSelectedUsers(new Set())
      loadUsers()
    } catch (err: any) {
      alert(`Error deactivating users: ${err.message}`)
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Email', 'Name', 'Role', 'Country', 'Trust Score', 'Onboarding Completed', 'Created At'].join(','),
      ...users.map(user => [
        user.email,
        user.name || '',
        user.role,
        user.country || '',
        user.trust_score?.toString() || '',
        user.onboarding_completed.toString(),
        new Date(user.created_at).toISOString(),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'company':
        return 'secondary'
      case 'contributor':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 gradient-text">User Management</h1>
        <p className="text-muted-foreground">Manage all users in the system</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="contributor">Contributors</SelectItem>
                <SelectItem value="company">Companies</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportUsers} disabled={users.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {selectedUsers.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedUsers.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>All registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
                        <Checkbox
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="h-4 w-4"
                        />
                      </TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Role</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Country</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">Trust Score</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-xs sm:text-sm px-2 sm:px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-2 sm:px-4">
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 max-w-[150px] sm:max-w-none truncate">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden sm:table-cell truncate max-w-[120px]">
                          {user.name || '-'}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">
                          {user.country || '-'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden lg:table-cell">
                          {user.trust_score !== null ? user.trust_score.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right px-2 sm:px-4">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(user)}
                              title="View Details"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Edit"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              title="Delete"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      {viewingUser && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Complete user information and activity</DialogDescription>
            </DialogHeader>
            <UserDetailView
              user={viewingUser}
              activity={userActivity[viewingUser.id] || []}
              onClose={() => {
                setShowViewDialog(false)
                setViewingUser(null)
              }}
              onEdit={() => {
                setShowViewDialog(false)
                setEditingUser(viewingUser)
                setShowEditDialog(true)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingUser && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <EditUserForm
              user={editingUser}
              onSave={handleSave}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingUser(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function UserDetailView({
  user,
  activity,
  onClose,
  onEdit,
}: {
  user: AdminUser
  activity: any[]
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <Label>Name</Label>
            <p className="text-sm">{user.name || '-'}</p>
          </div>
          <div>
            <Label>Role</Label>
            <Badge variant={
              user.role === 'admin' || user.role === 'platform_admin' ? 'default' : 
              user.role === 'client_owner' || user.role === 'client_user' ? 'secondary' : 
              user.role === 'team_account' ? 'outline' : 'outline'
            }>
              {user.role}
            </Badge>
          </div>
          <div>
            <Label>Country</Label>
            <p className="text-sm">{user.country || '-'}</p>
          </div>
          {user.trust_score !== null && (
            <div>
              <Label>Trust Score</Label>
              <p className="text-sm font-medium">{user.trust_score.toFixed(1)}</p>
            </div>
          )}
          <div>
            <Label>Onboarding Completed</Label>
            <p className="text-sm">{user.onboarding_completed ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <Label>Languages</Label>
            <p className="text-sm">{user.languages?.join(', ') || '-'}</p>
          </div>
          <div>
            <Label>Expertise Fields</Label>
            <p className="text-sm">{user.expertise_fields?.join(', ') || '-'}</p>
          </div>
          <div>
            <Label>Created At</Label>
            <p className="text-sm">{new Date(user.created_at).toLocaleString()}</p>
          </div>
          <div>
            <Label>Last Updated</Label>
            <p className="text-sm">{new Date(user.updated_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="activity" className="space-y-4">
        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity found
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {item.data && (
                    <div className="text-sm mt-1 text-muted-foreground">
                      {item.data.content && `Question: ${item.data.content.substring(0, 60)}...`}
                      {item.data.answer_text && `Answer: ${item.data.answer_text.substring(0, 60)}...`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

function EditUserForm({
  user,
  onSave,
  onCancel,
}: {
  user: AdminUser
  onSave: (data: Partial<AdminUser>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    role: user.role,
    country: user.country || '',
    trust_score: user.trust_score?.toString() || '',
  })

  return (
    <div className="space-y-4">
      <div>
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>
      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contributor">Contributor</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Country</Label>
        <Input
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>
      {user.role === 'contributor' && (
        <div>
          <Label>Trust Score</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.trust_score}
            onChange={(e) => setFormData({ ...formData, trust_score: e.target.value })}
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave({
            name: formData.name,
            role: formData.role,
            country: formData.country,
            trust_score: formData.trust_score ? parseFloat(formData.trust_score) : null,
          })}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

