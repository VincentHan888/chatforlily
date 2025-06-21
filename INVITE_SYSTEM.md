# 邀请码权限控制系统

## 概述

为了防止网址外泄和控制访问权限，本系统实现了基于邀请码的权限控制机制。用户必须使用有效的邀请码才能访问系统。

## 系统特性

- ✅ 邀请码验证机制
- ✅ 邀请码使用次数限制
- ✅ 邀请码过期时间控制
- ✅ 邀请码管理界面
- ✅ 自动创建带邀请码的访客用户
- ✅ 完整的权限控制流程

## 工作流程

### 1. 用户访问流程

1. **用户访问网站** → 中间件检查认证状态
2. **未认证用户** → 检查URL中是否有邀请码参数
3. **有邀请码** → 验证邀请码有效性 → 创建访客用户 → 登录
4. **无邀请码** → 重定向到邀请码输入页面 (`/invite`)
5. **输入邀请码** → 验证通过 → 创建访客用户 → 登录

### 2. 邀请码验证规则

- 邀请码必须存在且有效
- 邀请码未被禁用 (`isActive = true`)
- 邀请码未过期（如果设置了过期时间）
- 邀请码使用次数未达到上限

## 使用方法

### 创建邀请码

#### 方法1：通过API创建（用于测试）
```bash
curl http://localhost:3000/api/create-invite
```

#### 方法2：通过管理界面
访问 `/admin/invite` 页面（需要管理员权限）

#### 方法3：通过脚本生成
```bash
node scripts/generate-invite.js [数量] [最大使用次数] [描述]

# 示例
node scripts/generate-invite.js 5 10 "家庭成员邀请码"
node scripts/generate-invite.js 1 unlimited "管理员邀请码"
```

### 使用邀请码

#### 方法1：URL参数
```
http://localhost:3000?invite=YOUR_INVITE_CODE
```

#### 方法2：邀请码输入页面
1. 直接访问网站 → 自动跳转到邀请码输入页面
2. 输入邀请码 → 点击验证

## 数据库结构

### InviteCode 表
```sql
CREATE TABLE "InviteCode" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) UNIQUE NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  expiresAt TIMESTAMP,
  usedAt TIMESTAMP,
  usedBy UUID REFERENCES "User"(id),
  maxUses VARCHAR(10) NOT NULL DEFAULT '1',
  currentUses VARCHAR(10) NOT NULL DEFAULT '0',
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdBy VARCHAR(64) NOT NULL DEFAULT 'system',
  description TEXT
);
```

### User 表更新
```sql
ALTER TABLE "User" ADD COLUMN inviteCodeUsed VARCHAR(32);
ALTER TABLE "User" ADD COLUMN isVerified BOOLEAN NOT NULL DEFAULT false;
```

## API 接口

### 创建邀请码
```http
POST /api/invite
Content-Type: application/json

{
  "maxUses": "5",
  "expiresAt": "2024-12-31T23:59:59Z",
  "description": "测试邀请码"
}
```

### 获取邀请码列表
```http
GET /api/invite
```

### 禁用邀请码
```http
DELETE /api/invite?code=INVITE_CODE
```

## 配置说明

### 环境变量
确保以下环境变量已配置：
- `POSTGRES_URL` - 数据库连接字符串
- `AUTH_SECRET` - NextAuth密钥
- `NEXTAUTH_URL` - 应用URL（可选）

### 权限控制
当前管理员权限检查逻辑：
```typescript
// 简单检查：邮箱包含 "admin"
if (!session?.user?.email || !session.user.email.includes('admin')) {
  return NextResponse.json({ error: '无权限' }, { status: 403 });
}
```

**建议：** 根据实际需求修改权限检查逻辑。

## 安全考虑

1. **邀请码复杂度**：使用12位随机字符串，包含数字和字母
2. **使用次数限制**：防止邀请码被滥用
3. **过期时间**：可设置邀请码有效期
4. **禁用机制**：可手动禁用邀请码
5. **访问日志**：记录邀请码使用情况

## 故障排除

### 常见问题

1. **邀请码无效**
   - 检查邀请码是否正确
   - 确认邀请码未过期
   - 验证邀请码使用次数

2. **数据库连接错误**
   - 检查 `POSTGRES_URL` 环境变量
   - 确认数据库迁移已执行

3. **权限被拒绝**
   - 检查用户邮箱是否包含 "admin"
   - 修改权限检查逻辑

### 调试命令

```bash
# 检查数据库迁移状态
npx drizzle-kit push

# 查看邀请码表数据
psql $POSTGRES_URL -c "SELECT * FROM \"InviteCode\";"

# 查看用户表数据
psql $POSTGRES_URL -c "SELECT * FROM \"User\";"
```

## 部署注意事项

1. **生产环境**：修改管理员权限检查逻辑
2. **HTTPS**：确保生产环境使用HTTPS
3. **环境变量**：妥善保管数据库连接字符串
4. **监控**：建议添加邀请码使用监控

## 扩展功能

可以考虑添加的功能：
- 邀请码分组管理
- 邀请码使用统计
- 邮件邀请功能
- 批量邀请码生成
- 邀请码模板系统 