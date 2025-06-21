import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { validateInviteCode } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const inviteCode = searchParams.get('invite');

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 验证邀请码
  if (!inviteCode) {
    return NextResponse.redirect(
      new URL(
        `/invite?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        request.url,
      ),
    );
  }

  try {
    const validation = await validateInviteCode(inviteCode);
    if (!validation.valid) {
      return NextResponse.redirect(
        new URL(
          `/invite?error=${encodeURIComponent(validation.reason || '邀请码无效')}&redirectUrl=${encodeURIComponent(redirectUrl)}`,
          request.url,
        ),
      );
    }
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/invite?error=${encodeURIComponent('验证邀请码时出错')}&redirectUrl=${encodeURIComponent(redirectUrl)}`,
        request.url,
      ),
    );
  }

  // 邀请码有效，创建访客用户
  return signIn('guest-with-invite', {
    redirect: true,
    redirectTo: redirectUrl,
    inviteCode,
  });
}
