# 佳明活动导出到Strava使用说明

## 功能描述

这个脚本可以从佳明国内版API导出最新的一条活动记录，并自动上传到Strava平台。

## 前置条件

### 1. 佳明中国区账号配置
在 `src/constant.ts` 中配置您的佳明中国区账号信息：

```typescript
// 佳明中国区账号及密码
export const GARMIN_USERNAME_DEFAULT = 'your_email@example.com';
export const GARMIN_PASSWORD_DEFAULT = 'your_password';
```

### 2. Strava API配置
在 `src/constant.ts` 中配置您的Strava API信息：

```typescript
// STRAVA ACCOUNT
export const STRAVA_ACCESS_TOKEN_DEFAULT = 'your_strava_access_token';
export const STRAVA_CLIENT_ID_DEFAULT = 'your_strava_client_id';
export const STRAVA_CLIENT_SECRET_DEFAULT = 'your_strava_client_secret';
export const STRAVA_REDIRECT_URI_DEFAULT = 'your_redirect_uri';
```

### 3. 获取Strava Access Token

#### 方法一：通过Strava API获取
1. 访问 [Strava API设置页面](https://www.strava.com/settings/api)
2. 创建应用并获取 Client ID 和 Client Secret
3. 使用以下URL获取授权码：
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=activity:write,read
   ```
4. 使用授权码获取Access Token

#### 方法二：使用现有工具
可以使用现有的Strava API工具或在线服务来获取Access Token。

### 4. 环境变量配置（可选）
您也可以通过环境变量来配置，这样更安全：

```bash
export GARMIN_USERNAME="your_email@example.com"
export GARMIN_PASSWORD="your_password"
export STRAVA_ACCESS_TOKEN="your_strava_access_token"
export STRAVA_CLIENT_ID="your_strava_client_id"
export STRAVA_CLIENT_SECRET="your_strava_client_secret"
export STRAVA_REDIRECT_URI="your_redirect_uri"
export BARK_KEY="your_bark_key"  # 可选，用于推送通知
```

## 使用方法

### 1. 安装依赖
```bash
yarn install
```

### 2. 运行脚本
```bash
# 使用yarn运行
yarn export_to_strava

# 或直接使用ts-node运行
ts-node src/export_to_strava.ts
```

### 3. 查看结果
脚本运行后会显示详细的执行日志，包括：
- 佳明连接状态
- 最新活动信息
- 文件下载进度
- Strava上传状态
- 最终结果

## 功能特性

### 1. 自动活动类型映射
脚本会自动将佳明的活动类型映射到Strava的活动类型：

| 佳明类型 | Strava类型 |
|---------|-----------|
| running | Run |
| cycling | Ride |
| swimming | Swim |
| walking | Walk |
| hiking | Hike |
| yoga | Yoga |
| 其他 | Run (默认) |

### 2. 支持多种文件格式
- FIT (佳明原生格式)
- GPX (GPS交换格式)
- TCX (Training Center XML)

### 3. 智能错误处理
- 自动重试机制
- 详细的错误日志
- 推送通知（如果配置了Bark）

### 4. 重复检查
脚本会检查Strava中是否已存在相同的活动，避免重复上传。

## 输出示例

```
🚀 开始导出佳明最新活动到Strava...
📱 连接佳明中国区...
✅ 找到最新活动: {
  id: 123456789,
  name: '晨跑',
  startTime: '2024-01-15T06:30:00',
  type: 'running',
  distance: 5000,
  duration: 1800
}
⬇️ 下载活动原始数据...
✅ 文件下载完成: ./garmin_fit_files/123456789.fit
🔗 检查Strava连接...
✅ Strava连接正常
⬆️ 上传活动到Strava...
✅ 上传成功! 上传ID: 987654321
⏳ 等待Strava处理活动...
✅ Strava处理完成!
活动链接: https://www.strava.com/activities/123456789
🎉 任务完成！活动已成功同步到Strava
```

## 故障排除

### 1. 佳明登录失败
- 检查用户名和密码是否正确
- 确保网络可以访问佳明中国区服务器
- 检查是否需要科学上网

### 2. Strava上传失败
- 检查Access Token是否有效
- 确认API权限是否包含 `activity:write`
- 检查文件格式是否支持

### 3. 文件下载失败
- 检查磁盘空间是否充足
- 确认网络连接稳定
- 检查活动是否包含GPS数据

## 注意事项

1. **网络要求**: 需要能够访问佳明中国区和Strava的服务器
2. **API限制**: 注意Strava API的调用频率限制
3. **数据隐私**: 确保妥善保管您的账号信息
4. **文件清理**: 脚本会在本地临时存储活动文件，使用后可以手动清理

## 扩展功能

### 批量导出
如果需要导出多条活动，可以修改脚本中的 `getActivities(0, 1)` 参数：

```typescript
// 导出最近5条活动
const activities = await garminClient.getActivities(0, 5);
```

### 定时执行
可以结合crontab或其他定时任务工具，定期执行此脚本：

```bash
# 每天上午8点执行
0 8 * * * cd /path/to/garmin-sync && yarn export_to_strava
```

### 自定义过滤
可以根据活动类型、时间等条件过滤要导出的活动：

```typescript
// 只导出跑步活动
const activities = await garminClient.getActivities(0, 10);
const runningActivities = activities.filter(act => 
    act.activityType?.typeKey?.includes('running')
);
```
