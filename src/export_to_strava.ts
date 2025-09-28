import { BARK_KEY_DEFAULT } from './constant';
import { getGaminCNClient } from './utils/garmin_cn';
import { downloadGarminActivity } from './utils/garmin_common';
import { 
    uploadActivityToStrava, 
    checkUploadStatus, 
    getStravaUserInfo,
    getStravaActivities 
} from './utils/strava';

const axios = require('axios');
const core = require('@actions/core');

const BARK_KEY = process.env.BARK_KEY ?? BARK_KEY_DEFAULT;

/**
 * 从佳明国内版导出指定活动并上传到Strava
 * @param activityIndex 活动索引，0为最新，1为倒数第二条，以此类推
 */
export const exportLatestActivityToStrava = async (activityIndex: number = 0) => {
    try {
        console.log('🚀 开始导出佳明最新活动到Strava...');
        
        // 1. 获取佳明中国区客户端
        console.log('📱 连接佳明中国区...');
        const garminClient = await getGaminCNClient();
        
        // 2. 获取指定索引的活动记录
        console.log(`📋 获取第${activityIndex + 1}条活动记录...`);
        const activities = await garminClient.getActivities(0, activityIndex + 1);
        
        if (!activities || activities.length === 0) {
            console.log('❌ 没有找到任何活动记录');
            return;
        }
        
        if (activities.length <= activityIndex) {
            console.log(`❌ 没有找到第${activityIndex + 1}条活动记录，只有${activities.length}条活动`);
            return;
        }
        
        const targetActivity = activities[activityIndex];
        console.log(`✅ 找到第${activityIndex + 1}条活动:`, {
            id: targetActivity.activityId,
            name: targetActivity.activityName,
            startTime: targetActivity.startTimeLocal,
            type: targetActivity.activityType?.typeKey,
            distance: targetActivity.distance,
            duration: targetActivity.duration
        });
        
        // 3. 下载活动原始数据文件
        console.log('⬇️ 下载活动原始数据...');
        const filePath = await downloadGarminActivity(targetActivity.activityId, garminClient);
        console.log('✅ 文件下载完成:', filePath);
        
        // 4. 检查Strava连接
        console.log('🔗 检查Strava连接...');
        try {
            await getStravaUserInfo();
            console.log('✅ Strava连接正常');
        } catch (error) {
            console.error('❌ Strava连接失败:', error.message);
            throw new Error('Strava连接失败，请检查配置');
        }
        
        // 5. 上传到Strava
        console.log('⬆️ 上传活动到Strava...');
        const uploadResult = await uploadActivityToStrava(
            filePath,
            targetActivity.activityName,
            `从佳明同步的活动 - ${targetActivity.startTimeLocal}`,
            getStravaActivityType(targetActivity.activityType?.typeKey)
        );
        
        console.log('✅ 上传成功! 上传ID:', uploadResult.id);
        
        // 6. 等待处理完成并检查状态
        if (uploadResult.id) {
            console.log('⏳ 等待Strava处理活动...');
            await waitForUploadProcessing(uploadResult.id);
        }
        
        // 7. 发送成功通知
        if (BARK_KEY) {
            try {
                await axios.get(
                    `https://api.day.app/${BARK_KEY}/✅ 佳明活动已成功同步到Strava/${targetActivity.activityName}`
                );
            } catch (error) {
                console.log('通知发送失败:', error.message);
            }
        }
        
        console.log('🎉 任务完成！活动已成功同步到Strava');
        
    } catch (error) {
        console.error('❌ 导出失败:', error.message);
        
        // 发送失败通知
        if (BARK_KEY) {
            try {
                await axios.get(
                    `https://api.day.app/${BARK_KEY}/❌ 佳明活动同步到Strava失败/${error.message}`
                );
            } catch (notifyError) {
                console.log('通知发送失败:', notifyError.message);
            }
        }
        
        core.setFailed(error.message);
        throw error;
    }
};

/**
 * 将佳明活动类型映射到Strava活动类型
 */
const getStravaActivityType = (garminType: string): string => {
    const typeMapping: { [key: string]: string } = {
        'running': 'Run',
        'track_running': 'Run',
        'treadmill_running': 'Run',
        'street_running': 'Run',
        'cycling': 'Ride',
        'indoor_cycling': 'Ride',
        'mountain_biking': 'Ride',
        'walking': 'Walk',
        'hiking': 'Hike',
        'swimming': 'Swim',
        'indoor_swimming': 'Swim',
        'yoga': 'Yoga',
        'weight_training': 'WeightTraining',
        'elliptical': 'Elliptical',
        'rowing': 'Rowing',
        'crossfit': 'Crossfit'
    };
    
    return typeMapping[garminType] || 'Run';
};

/**
 * 等待Strava处理上传
 */
const waitForUploadProcessing = async (uploadId: string, maxWaitTime: number = 60000): Promise<void> => {
    const startTime = Date.now();
    const checkInterval = 5000; // 5秒检查一次
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const status = await checkUploadStatus(uploadId);
            
            if (status.status === 'Your activity is ready.') {
                console.log('✅ Strava处理完成!');
                console.log('活动链接:', `https://www.strava.com/activities/${status.activity_id}`);
                return;
            } else if (status.status === 'There was an error processing your activity.') {
                throw new Error('Strava处理活动时出错: ' + status.error);
            } else {
                console.log('⏳ 处理中...', status.status);
            }
            
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        } catch (error) {
            console.error('检查上传状态时出错:', error.message);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    console.log('⚠️ 等待超时，但上传可能仍在处理中');
};

/**
 * 检查是否已存在相同的活动
 */
const checkDuplicateActivity = async (activityName: string, startTime: string): Promise<boolean> => {
    try {
        const activities = await getStravaActivities(10, 1);
        
        for (const activity of activities) {
            if (activity.name === activityName && 
                new Date(activity.start_date_local).toISOString() === new Date(startTime).toISOString()) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log('检查重复活动时出错:', error.message);
        return false;
    }
};

// 如果直接运行此文件
if (require.main === module) {
    exportLatestActivityToStrava()
        .then(() => {
            console.log('脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('脚本执行失败:', error);
            process.exit(1);
        });
}
