'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

function InviteForm() {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get('error');
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      return;
    }

    setIsLoading(true);

    // 重定向到访客认证路由，带上邀请码
    const guestUrl = new URL('/api/auth/guest', window.location.origin);
    guestUrl.searchParams.set('invite', inviteCode.trim());
    guestUrl.searchParams.set('redirectUrl', redirectUrl);

    window.location.href = guestUrl.toString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">需要邀请码</CardTitle>
        <CardDescription>请输入邀请码以访问系统</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="输入邀请码"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              disabled={isLoading}
              className="text-center"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!inviteCode.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                验证中...
              </>
            ) : (
              '验证邀请码'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>没有邀请码？请联系管理员获取。</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">需要邀请码</CardTitle>
        <CardDescription>请输入邀请码以访问系统</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoadingCard />}>
        <InviteForm />
      </Suspense>
    </div>
  );
}
