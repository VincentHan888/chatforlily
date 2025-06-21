import { NextResponse } from 'next/server';
import { createInviteCode } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export async function GET() {
  try {
    // 生成一个简单的邀请码
    const code = generateUUID()
      .replace(/-/g, '')
      .substring(0, 12)
      .toUpperCase();

    const [inviteCode] = await createInviteCode({
      code,
      maxUses: '5',
      description: '测试邀请码',
      createdBy: 'system-test',
    });

    return NextResponse.json({
      success: true,
      inviteCode,
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
