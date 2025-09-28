# 佳明Token获取指南

## 概述

佳明使用OAuth 1.0a协议进行身份验证，与Strava的OAuth 2.0不同。本项目使用 `@gooin/garmin-connect` 库自动处理token的获取、存储和刷新。

## 自动Token管理（推荐）

### 1. 配置账号信息

在 `src/constant.ts` 中配置你的佳明账号：

```typescript
// 佳明中国区账号及密码
export const GARMIN_USERNAME_DEFAULT = 'your_email@example.com';
export const GARMIN_PASSWORD_DEFAULT = 'your_password';

// 佳明国际区账号及密码
export const GARMIN_GLOBAL_USERNAME_DEFAULT = 'your_global_email@example.com';
export const GARMIN_GLOBAL_PASSWORD_DEFAULT = 'your_global_password';
```

### 2. 自动登录和Token获取

当你第一次运行任何同步脚本时，系统会：

1. 使用用户名和密码登录佳明
2. 自动获取OAuth token
3. 将token加密保存到SQLite数据库
4. 后续运行时会自动使用保存的token

```bash
# 运行任何同步脚本都会自动处理token
yarn sync_cn
yarn sync_global
yarn export_to_strava
```

### 3. Token自动刷新

如果保存的token过期，系统会：
1. 检测到token无效
2. 自动使用用户名密码重新登录
3. 获取新的token并保存
4. 继续执行任务

## 手动Token管理

### 1. 查看当前Token

```bash
# 显示当前保存的token信息
yarn get_garmin_token show
```

### 2. 获取新Token

```bash
# 强制获取新的token
yarn get_garmin_token get
```

### 3. 清除Token

```bash
# 清除保存的token，强制重新登录
yarn get_garmin_token clear
```

## Token存储机制

### 1. 数据库存储

Token保存在SQLite数据库中：
- 文件位置：`./db/garmin.db`
- 表名：`garmin_session`
- 加密：使用AES加密存储

### 2. 存储结构

```sql
CREATE TABLE garmin_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user VARCHAR(20),           -- 用户名
    region VARCHAR(20),         -- 区域 (CN/GLOBAL)
    session TEXT                -- 加密的token信息
);
```

### 3. Token内容

每个token包含：
- `oauth1`: OAuth 1.0a的token
- `oauth2`: OAuth 2.0的token（如果支持）
- `sessionJson`: 完整的会话信息

## 网络要求

### 1. 中国区访问

- 需要能够访问 `connect.garmin.cn`
- 通常不需要科学上网
- 确保网络稳定

### 2. 国际区访问

- 需要能够访问 `connect.garmin.com`
- 可能需要科学上网
- 建议使用稳定的VPN

### 3. 测试网络连接

```bash
# 测试中国区连接
ping sso.garmin.cn

# 测试国际区连接
ping sso.garmin.com
```

## 常见问题

### 1. 登录失败

**问题**: 提示"佳明中国区登录失败"

**解决方案**:
- 检查用户名和密码是否正确
- 确认网络可以访问佳明服务器
- 尝试清除token重新登录：`yarn get_garmin_token clear`

### 2. Token过期

**问题**: 提示"Session expired"或类似错误

**解决方案**:
- 系统会自动处理，通常不需要手动干预
- 如果持续失败，尝试清除token：`yarn get_garmin_token clear`

### 3. 网络连接问题

**问题**: 无法连接到佳明服务器

**解决方案**:
- 检查网络连接
- 尝试更换网络环境
- 对于国际区，确保科学上网正常

### 4. 数据库错误

**问题**: SQLite数据库相关错误

**解决方案**:
- 删除 `./db/garmin.db` 文件
- 重新运行脚本，系统会重新创建数据库

## 高级配置

### 1. 自定义AES密钥

在 `src/constant.ts` 中修改：

```typescript
export const AESKEY_DEFAULT = 'your_custom_aes_key';
```

### 2. 自定义数据库路径

在 `src/constant.ts` 中修改：

```typescript
export const DB_FILE_PATH = './custom_path/garmin.db';
```

### 3. 环境变量配置

可以通过环境变量配置：

```bash
export GARMIN_USERNAME="your_email@example.com"
export GARMIN_PASSWORD="your_password"
export GARMIN_GLOBAL_USERNAME="your_global_email@example.com"
export GARMIN_GLOBAL_PASSWORD="your_global_password"
export AESKEY="your_custom_aes_key"
```

## 安全注意事项

### 1. 密码安全

- 不要在代码中硬编码密码
- 使用环境变量或配置文件
- 不要将包含密码的文件提交到版本控制

### 2. Token安全

- Token已加密存储
- 不要手动修改数据库文件
- 定期更新密码

### 3. 网络安全

- 使用HTTPS连接
- 避免在公共网络环境下运行
- 定期检查网络连接

## 调试和日志

### 1. 启用详细日志

在代码中添加：

```typescript
console.log('Token信息:', client.exportToken());
```

### 2. 检查数据库

```bash
# 使用SQLite命令行工具
sqlite3 ./db/garmin.db
.tables
SELECT * FROM garmin_session;
```

### 3. 清除所有数据

```bash
# 删除数据库文件
rm ./db/garmin.db

# 清除下载的文件
rm -rf ./garmin_fit_files/*
```

## 总结

佳明的Token管理相对简单：

1. **配置账号**: 在 `constant.ts` 中设置用户名密码
2. **自动处理**: 系统会自动获取、存储和刷新token
3. **无需手动**: 通常不需要手动管理token
4. **故障排除**: 使用提供的工具命令进行调试

如果遇到问题，按照上述故障排除步骤操作即可。
