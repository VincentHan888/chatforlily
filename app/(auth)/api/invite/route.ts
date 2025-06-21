import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { authConfig } from '@/app/(auth)/auth.config';
import {
  createInviteCode,
  getAllInviteCodes,
  disableInviteCode,
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

// 检查管理员权限
async function checkAdminPermission() {
  const session = await auth();

  if (!session?.user?.email || !session.user.email.includes('admin')) {
    return false;
  }

  return true;
}

// GET - 获取所有邀请码
export async function GET() {
  try {
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const inviteCodes = await getAllInviteCodes();
    return NextResponse.json({ success: true, data: inviteCodes });
  } catch (error) {
    console.error('获取邀请码失败:', error);
    return NextResponse.json(
      { error: '获取邀请码失败', details: error },
      { status: 500 },
    );
  }
}

// POST - 创建邀请码
export async function POST(request: Request) {
  try {
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { maxUses = '1', expiresAt, description } = body;

    // 生成邀请码
    const code = generateUUID()
      .replace(/-/g, '')
      .substring(0, 12)
      .toUpperCase();

    const [inviteCode] = await createInviteCode({
      code,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      description,
      createdBy: 'admin',
    });

    return NextResponse.json({
      success: true,
      data: inviteCode,
      message: `邀请码创建成功: ${code}`,
      link: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}?invite=${code}`,
    });
  } catch (error) {
    console.error('创建邀请码失败:', error);
    return NextResponse.json(
      { error: '创建邀请码失败', details: error },
      { status: 500 },
    );
  }
}

// DELETE - 禁用邀请码
export async function DELETE(request: Request) {
  try {
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: '缺少邀请码参数' }, { status: 400 });
    }

    const [disabledCode] = await disableInviteCode(code);

    if (!disabledCode) {
      return NextResponse.json({ error: '邀请码不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: disabledCode,
      message: `邀请码 ${code} 已禁用`,
    });
  } catch (error) {
    console.error('禁用邀请码失败:', error);
    return NextResponse.json(
      { error: '禁用邀请码失败', details: error },
      { status: 500 },
    );
  }
}
