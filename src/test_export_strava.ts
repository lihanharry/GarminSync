import { exportLatestActivityToStrava } from './export_to_strava';
import { getStravaUserInfo } from './utils/strava';

/**
 * 测试脚本 - 验证佳明到Strava的导出功能
 */
async function testExportToStrava() {
    console.log('🧪 开始测试佳明到Strava导出功能...\n');
    
    try {
        // 1. 测试Strava连接
        console.log('1️⃣ 测试Strava连接...');
        await getStravaUserInfo();
        console.log('✅ Strava连接测试通过\n');
        
        // 2. 执行导出功能
        console.log('2️⃣ 执行导出功能...');
        await exportLatestActivityToStrava();
        console.log('✅ 导出功能测试通过\n');
        
        console.log('🎉 所有测试通过！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('请检查配置是否正确：');
        console.error('- 佳明中国区账号密码');
        console.error('- Strava API配置');
        console.error('- 网络连接');
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    testExportToStrava();
}
