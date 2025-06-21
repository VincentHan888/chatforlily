#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const crypto = require('node:crypto');
const { eq } = require('drizzle-orm');

// 生成随机邀请码
function generateInviteCode() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function main() {
  const count = Number.parseInt(process.argv[2]) || 1;
  const maxUses = process.argv[3] || '1';
  const description = process.argv[4] || '管理员生成的邀请码';

  console.log(`正在生成 ${count} 个邀请码...`);

  try {
    // 连接数据库
    const client = postgres(process.env.POSTGRES_URL);
    const db = drizzle(client);

    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();

      // 插入邀请码 - 使用sql模板字符串
      const result = await client`
        INSERT INTO "InviteCode" (code, "maxUses", description, "createdBy", "createdAt", "currentUses", "isActive")
        VALUES (${code}, ${maxUses}, ${description}, 'admin-script', NOW(), '0', true)
        RETURNING *
      `;

      codes.push({
        code,
        maxUses,
        description,
      });
    }

    console.log('\n✅ 邀请码生成成功！');
    console.log('========================');

    codes.forEach((invite, index) => {
      console.log(`邀请码 ${index + 1}: ${invite.code}`);
      console.log(`最大使用次数: ${invite.maxUses}`);
      console.log(`描述: ${invite.description}`);
      console.log(`访问链接: http://localhost:3000?invite=${invite.code}`);
      console.log('------------------------');
    });

    console.log(`\n总计: ${codes.length} 个邀请码`);

    await client.end();
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
  node scripts/generate-invite.js [数量] [最大使用次数] [描述]

参数:
  数量          要生成的邀请码数量 (默认: 1)
  最大使用次数   每个邀请码的最大使用次数 (默认: 1)
  描述          邀请码描述 (默认: "管理员生成的邀请码")

示例:
  node scripts/generate-invite.js 5 10 "家庭成员邀请码"
  node scripts/generate-invite.js 1 unlimited "管理员邀请码"
  `);
  process.exit(0);
}

main();
