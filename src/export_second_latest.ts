import { exportLatestActivityToStrava } from './export_to_strava';

/**
 * 导出倒数第二条活动到Strava
 */
async function exportSecondLatestActivity() {
    console.log('🚀 开始导出倒数第二条活动到Strava...\n');
    
    try {
        // 导出倒数第二条活动（索引为1）
        await exportLatestActivityToStrava(1);
        console.log('\n🎉 倒数第二条活动导出完成！');
    } catch (error) {
        console.error('❌ 导出失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    exportSecondLatestActivity();
}
