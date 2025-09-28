# GarminSync 设计文档

## 项目目标
- 在 Garmin 中国区与国际区之间进行活动数据同步与历史迁移
- 采集 RunningQuotient（RQ）概览并写入 Google Sheets
- 支持 GitHub Actions 定时执行与失败 Bark 通知

## 功能概览
- 同步：CN→Global [`syncGarminCN2GarminGlobal`](src/utils/garmin_cn.ts)、Global→CN [`syncGarminGlobal2GarminCN`](src/utils/garmin_global.ts)
- 迁移：CN→Global [`migrateGarminCN2GarminGlobal`](src/utils/garmin_cn.ts)、Global→CN [`migrateGarminGlobal2GarminCN`](src/utils/garmin_global.ts)
- RQ采集与表格写入：[`doRQGoogleSheets`](src/utils/runningquotient.ts) → [`insertDataToSheets`](src/utils/google_sheets.ts)
- 失败通知：入口脚本调用 Bark，见 [src/index.ts](src/index.ts)、[src/sync_garmin_cn_to_global.ts](src/sync_garmin_cn_to_global.ts)、[src/sync_garmin_global_to_cn.ts](src/sync_garmin_global_to_cn.ts)

## 架构
- 核心模块
  - Garmin CN 客户端：[src/utils/garmin_cn.ts](src/utils/garmin_cn.ts)
  - Garmin Global 客户端：[src/utils/garmin_global.ts](src/utils/garmin_global.ts)
  - 活动下载/上传通用逻辑：[src/utils/garmin_common.ts](src/utils/garmin_common.ts)
  - 会话存储（SQLite + AES）：[src/utils/sqlite.ts](src/utils/sqlite.ts)
  - RQ 数据采集与解析：[src/utils/runningquotient.ts](src/utils/runningquotient.ts)
  - Google Sheets 写入：[src/utils/google_sheets.ts](src/utils/google_sheets.ts)
  - Strava（暂弃）：[src/utils/strava.ts](src/utils/strava.ts)
- 类型定义：[`GarminClientType`](src/utils/type.ts)
- 常量与默认配置：[src/constant.ts](src/constant.ts)
- 入口脚本
  - 同步：[
    src/sync_garmin_cn_to_global.ts](src/sync_garmin_cn_to_global.ts)、[
    src/sync_garmin_global_to_cn.ts](src/sync_garmin_global_to_cn.ts)
  - 迁移：[
    src/migrate_garmin_cn_to_global.ts](src/migrate_garmin_cn_to_global.ts)、[
    src/migrate_garmin_global_to_cn.ts](src/migrate_garmin_global_to_cn.ts)

## 数据流
- CN→Global 同步
  1. 创建 CN 客户端：[`getGaminCNClient`](src/utils/garmin_cn.ts)
  2. 比较最新活动时间，找出新增
  3. 对新增活动：[`downloadGarminActivity`](src/utils/garmin_common.ts) → [`uploadGarminActivity`](src/utils/garmin_common.ts)
- Global→CN 同步
  1. 创建 Global 客户端：[`getGaminGlobalClient`](src/utils/garmin_global.ts)
  2. 比较最新活动时间，找出新增并反向上传到 CN
- 历史迁移（两方向）
  - 批量读取活动切片，逐条下载原始数据并上传到目标区
- RQ + Sheets
  - [`getRQOverView`](src/utils/runningquotient.ts) + [`getGarminStatistics`](src/utils/garmin_common.ts) 合并，若活动ID变化则 [`insertDataToSheets`](src/utils/google_sheets.ts)

## 会话与存储
- SQLite 文件：[db/garmin.db](db/garmin.db)
- 表：garmin_session(user, region, session)
- 加密：[`encryptSession`](src/utils/sqlite.ts)/[`decryptSession`](src/utils/sqlite.ts) 使用 AES，密钥取自 [`AESKEY_DEFAULT`](src/constant.ts)

## 配置
- 环境变量/Secrets：
  - Garmin：`GARMIN_USERNAME`/`GARMIN_PASSWORD`、`GARMIN_GLOBAL_USERNAME`/`GARMIN_GLOBAL_PASSWORD`
  - 迁移参数：`GARMIN_MIGRATE_NUM`、`GARMIN_MIGRATE_START`、`GARMIN_SYNC_NUM`
  - RQ：`RQ_COOKIE`、`RQ_CSRF_TOKEN`、`RQ_USERID`
  - Google：`GOOGLE_API_CLIENT_EMAIL`、`GOOGLE_API_PRIVATE_KEY`、`GOOGLE_SHEET_ID`
  - 通知：`BARK_KEY`、可选 `AESKEY`
- 默认值与URL常量在 [src/constant.ts](src/constant.ts)

## CI/定时
- 工作流目录：[.github/workflows](.github/workflows)
  - CN→Global 同步：[sync_garmin_cn_to_garmin_global.yml](.github/workflows/sync_garmin_cn_to_garmin_global.yml)
  - Global→CN 同步：[sync_garmin_global_to_garmin_cn.yml](.github/workflows/sync_garmin_global_to_garmin_cn.yml)
  - 历史迁移（两方向）：[
    migrate_garmin_cn_to_garmin_global.yml](.github/workflows/migrate_garmin_cn_to_garmin_global.yml)、[
    migrate_garmin_global_to_garmin_cn.yml](.github/workflows/migrate_garmin_global_to_garmin_cn.yml)
- Node 版本：14；自动提交保存会话

## 运行与脚本
- 安装：`yarn`
- 脚本见 [package.json](package.json)：
  - 同步：`yarn sync_cn`、`yarn sync_global`
  - 迁移：`yarn migrate_garmin_cn_to_global`、`yarn migrate_garmin_global_to_cn`
  - RQ采集：`yarn rq`

## 依赖
- Garmin 接入：`@gooin/garmin-connect`
- HTTP与工具：`axios`、`lodash`、`decompress`、`unzipper`
- 数据库：`sqlite`、`sqlite3`
- Google API：`google-auth-library`、`googleapis`
- CI：`@actions/core`

## 错误处理与通知
- 入口脚本捕获异常并通过 Bark 通知；同时 `core.setFailed` 标记失败

## 安全与注意事项
- 会话加密存储，避免明文泄露
- 所有凭据使用环境变量/Secrets，不应写入代码库
- 需要可访问两边 Garmin 服务的网络环境

## 局限与改进建议
- Node 14 依赖较旧，建议升级并完善类型定义
- 增加重试/速率限制策略与详细日志
- 引入测试与类型检查流程，完善错误上报通道
