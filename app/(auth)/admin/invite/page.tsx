'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface InviteCode {
  id: string;
  code: string;
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
  maxUses: string;
  currentUses: string;
  isActive: boolean;
  createdBy: string;
  description?: string;
}

export default function AdminInvitePage() {
  const { data: session, status } = useSession();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 创建表单状态
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [description, setDescription] = useState('');

  // 检查权限
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email || !session.user.email.includes('admin')) {
      window.location.href = '/';
      return;
    }

    fetchInviteCodes();
  }, [session, status]);

  // 获取邀请码列表
  const fetchInviteCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invite');
      const data = await response.json();

      if (data.success) {
        setInviteCodes(data.data);
      } else {
        toast.error(data.error || '获取邀请码失败');
      }
    } catch (error) {
      toast.error('获取邀请码失败');
      console.error('获取邀请码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建邀请码
  const createInviteCode = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxUses,
          expiresAt: expiresAt || undefined,
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowCreateForm(false);
        setMaxUses('1');
        setExpiresAt('');
        setDescription('');
        fetchInviteCodes();
      } else {
        toast.error(data.error || '创建邀请码失败');
      }
    } catch (error) {
      toast.error('创建邀请码失败');
      console.error('创建邀请码失败:', error);
    } finally {
      setCreating(false);
    }
  };

  // 禁用邀请码
  const disableInviteCode = async (code: string) => {
    if (!confirm(`确定要禁用邀请码 ${code} 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/invite?code=${code}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchInviteCodes();
      } else {
        toast.error(data.error || '禁用邀请码失败');
      }
    } catch (error) {
      toast.error('禁用邀请码失败');
      console.error('禁用邀请码失败:', error);
    }
  };

  // 复制邀请链接
  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('邀请链接已复制到剪贴板');
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态徽章
  const getStatusBadge = (inviteCode: InviteCode) => {
    if (!inviteCode.isActive) {
      return <Badge variant="destructive">已禁用</Badge>;
    }

    if (inviteCode.expiresAt && new Date() > new Date(inviteCode.expiresAt)) {
      return <Badge variant="destructive">已过期</Badge>;
    }

    const currentUses = Number.parseInt(inviteCode.currentUses);
    const maxUses =
      inviteCode.maxUses === 'unlimited'
        ? Number.POSITIVE_INFINITY
        : Number.parseInt(inviteCode.maxUses);

    if (currentUses >= maxUses) {
      return <Badge variant="destructive">已用完</Badge>;
    }

    return <Badge variant="default">有效</Badge>;
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">加载中...</div>
    );
  }

  if (!session?.user?.email || !session.user.email.includes('admin')) {
    return (
      <div className="flex justify-center items-center h-screen">
        无权限访问
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">邀请码管理</h1>
          <p className="text-gray-600 mt-2">管理系统邀请码，控制用户访问权限</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchInviteCodes}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw
              className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
          >
            <Plus className="size-4 mr-2" />
            创建邀请码
          </Button>
        </div>
      </div>

      {/* 创建邀请码表单 */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>创建新邀请码</CardTitle>
            <CardDescription>
              设置邀请码的使用次数、过期时间和描述信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUses">最大使用次数</Label>
                <Select value={maxUses} onValueChange={setMaxUses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1次</SelectItem>
                    <SelectItem value="5">5次</SelectItem>
                    <SelectItem value="10">10次</SelectItem>
                    <SelectItem value="50">50次</SelectItem>
                    <SelectItem value="unlimited">无限制</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiresAt">过期时间（可选）</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">描述（可选）</Label>
              <Textarea
                id="description"
                placeholder="输入邀请码的用途描述..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createInviteCode} disabled={creating}>
                {creating ? '创建中...' : '创建邀请码'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setMaxUses('1');
                  setExpiresAt('');
                  setDescription('');
                }}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 邀请码列表 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请码列表</CardTitle>
          <CardDescription>
            当前共有 {inviteCodes.length} 个邀请码
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无邀请码，点击上方按钮创建第一个邀请码
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>邀请码</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>使用情况</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inviteCodes.map((inviteCode) => (
                    <TableRow key={inviteCode.id}>
                      <TableCell className="font-mono">
                        {inviteCode.code}
                      </TableCell>
                      <TableCell>{getStatusBadge(inviteCode)}</TableCell>
                      <TableCell>
                        {inviteCode.currentUses} /{' '}
                        {inviteCode.maxUses === 'unlimited'
                          ? '∞'
                          : inviteCode.maxUses}
                      </TableCell>
                      <TableCell>{formatDate(inviteCode.createdAt)}</TableCell>
                      <TableCell>{formatDate(inviteCode.expiresAt)}</TableCell>
                      <TableCell>{inviteCode.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInviteLink(inviteCode.code)}
                          >
                            <Copy className="size-4" />
                          </Button>
                          {inviteCode.isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => disableInviteCode(inviteCode.code)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
