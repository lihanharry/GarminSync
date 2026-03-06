# 佳明活动导出工具

一个简洁的工具，用于将佳明（Garmin）活动按索引导出到Strava。

## 功能

- 🎯 按索引导出指定位置的佳明活动
- 🔒 安全的环境变量配置
- ✅ 完善的输入校验
- 📱 支持佳明中国区账号
- 🏃 支持所有活动类型（跑步、骑行、徒步等）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制并编辑环境变量文件：

```bash
cp .env.example .env
```

在 `.env` 文件中配置你的账号信息：

```bash
# 佳明中国区账号
GARMIN_USERNAME=your_garmin_email@example.com
GARMIN_PASSWORD=your_garmin_password

# Strava API 配置
STRAVA_ACCESS_TOKEN=your_strava_access_token
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### 3. 使用

```bash
# 导出最新活动（第1条）
npm run export 0

# 导出倒数第二条活动
npm run export 1

# 导出第5条活动
npm run export 4
```

## 活动索引说明

| 索引 | 描述 | 实际位置 |
|------|------|----------|
| 0 | 最新活动 | 第1条 |
| 1 | 倒数第二条 | 第2条 |
| 2 | 倒数第三条 | 第3条 |
| 3 | 倒数第四条 | 第4条 |
| ... | ... | ... |

## 输入校验

工具会自动验证输入参数：

- ✅ 检查参数数量
- ✅ 验证索引格式（必须是非负整数）
- ✅ 提供详细的错误提示和使用说明

## 项目结构

```
GarminSync/
├── src/
│   ├── constant.ts              # 环境变量配置
│   ├── export_by_index.ts       # 主功能脚本
│   ├── export_to_strava.ts      # 导出功能
│   └── utils/
│       ├── garmin_cn.ts         # 佳明中国区连接
│       ├── garmin_common.ts     # 佳明通用功能
│       ├── strava.ts            # Strava上传功能
│       ├── sqlite.ts            # 数据库管理
│       ├── type.ts              # 类型定义
│       └── number_tricks.ts     # 数字工具
├── package.json                 # 项目配置
├── tsconfig.json               # TypeScript配置
└── .env                        # 环境变量（不提交）
```

## 依赖包

- `@gooin/garmin-connect` - 佳明API
- `axios` - HTTP请求
- `strava-v3` - Strava API
- `sqlite3` - 数据库
- `dotenv` - 环境变量
- `form-data` - 文件上传

## 注意事项

1. **环境变量安全**：永远不要将 `.env` 文件提交到Git
2. **活动重复**：Strava会检测重复活动，已存在的活动会显示错误
3. **网络连接**：确保网络连接正常，API调用需要稳定的网络
4. **Token有效期**：Strava Access Token会过期，需要定期更新

## 故障排除

### 如果提示"缺少必需参数"
```bash
# 正确的用法
npm run export 0

# 错误的用法
npm run export
```

### 如果提示"无效的活动索引"
- 确保输入的是非负整数
- 不要输入小数或负数
- 参考使用说明中的示例

### 如果连接失败
- 检查 `.env` 文件配置是否正确
- 验证账号密码是否有效
- 检查网络连接

## 许可证

MIT License
