import { createInviteCode } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

async function generateInviteCodes() {
  const count = Number.parseInt(process.argv[2]) || 1;
  const maxUses = process.argv[3] || '1';
  const description = process.argv[4] || '管理员生成的邀请码';

  console.log(`正在生成 ${count} 个邀请码...`);

  try {
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = generateUUID()
        .replace(/-/g, '')
        .substring(0, 12)
        .toUpperCase();

      const [inviteCode] = await createInviteCode({
        code,
        maxUses,
        description,
        createdBy: 'admin-script',
      });

      codes.push(inviteCode);
    }

    console.log('\n✅ 邀请码生成成功！');
    console.log('========================');

    codes.forEach((invite, index) => {
      console.log(`邀请码 ${index + 1}: ${invite.code}`);
      console.log(`最大使用次数: ${invite.maxUses}`);
      console.log(`描述: ${invite.description}`);
      console.log(
        `访问链接: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}?invite=${invite.code}`,
      );
      console.log('------------------------');
    });

    console.log(`\n总计: ${codes.length} 个邀请码`);
  } catch (error) {
    console.error('❌ 生成邀请码失败:', error);
    process.exit(1);
  }
}

// 显示使用说明
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
邀请码生成脚本

使用方法:
  npx tsx scripts/generate-invite.ts [数量] [最大使用次数] [描述]

参数:
  数量          要生成的邀请码数量 (默认: 1)
  最大使用次数   每个邀请码的最大使用次数 (默认: 1)
  描述          邀请码描述 (默认: "管理员生成的邀请码")

示例:
  npx tsx scripts/generate-invite.ts 5 10 "家庭成员邀请码"
  npx tsx scripts/generate-invite.ts 1 unlimited "管理员邀请码"
  `);
  process.exit(0);
}

generateInviteCodes();
