import { exportLatestActivityToStrava } from './export_to_strava';

/**
 * 显示使用帮助信息
 */
function showUsage() {
    console.log(`
📖 使用说明:

用法: npm run export_by_index [索引]

参数说明:
  [索引]    活动索引，从0开始计算
           0 = 最新活动（第1条）
           1 = 倒数第二条（第2条）
           2 = 倒数第三条（第3条）
           ...

示例:
  npm run export_by_index 0     # 导出最新活动
  npm run export_by_index 1     # 导出倒数第二条活动
  npm run export_by_index 5     # 导出第6条活动

注意事项:
  - 索引必须是非负整数
  - 如果指定的活动不存在，脚本会提示错误
  - 活动按时间倒序排列（最新的在前）
`);
}

/**
 * 验证输入参数
 * @param input 用户输入的字符串
 * @returns 验证后的索引值，如果无效返回null
 */
function validateInput(input: string): number | null {
    // 检查是否为空
    if (!input || input.trim() === '') {
        return null;
    }
    
    // 检查是否为数字
    const num = parseInt(input.trim());
    if (isNaN(num)) {
        return null;
    }
    
    // 检查是否为整数
    if (!Number.isInteger(parseFloat(input.trim()))) {
        return null;
    }
    
    // 检查是否为非负数
    if (num < 0) {
        return null;
    }
    
    return num;
}

/**
 * 根据索引导出指定活动到Strava
 * 使用方法: npm run export_by_index 1  (导出倒数第二条)
 */
async function exportActivityByIndex() {
    // 从命令行参数获取索引
    const args = process.argv.slice(2);
    
    // 检查参数数量
    if (args.length === 0) {
        console.error('❌ 错误: 缺少必需参数');
        showUsage();
        process.exit(1);
    }
    
    if (args.length > 1) {
        console.error('❌ 错误: 参数过多');
        showUsage();
        process.exit(1);
    }
    
    // 验证输入
    const activityIndex = validateInput(args[0]);
    
    if (activityIndex === null) {
        console.error('❌ 错误: 无效的活动索引');
        console.error(`   输入: "${args[0]}"`);
        console.error('   活动索引必须是非负整数');
        showUsage();
        process.exit(1);
    }
    
    console.log(`🚀 开始导出第${activityIndex + 1}条活动到Strava...\n`);
    
    try {
        await exportLatestActivityToStrava(activityIndex);
        console.log(`\n🎉 第${activityIndex + 1}条活动导出完成！`);
    } catch (error) {
        console.error('❌ 导出失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    exportActivityByIndex();
}
