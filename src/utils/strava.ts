const strava = require('strava-v3');
import {
    STRAVA_ACCESS_TOKEN_DEFAULT,
    STRAVA_CLIENT_ID_DEFAULT,
    STRAVA_CLIENT_SECRET_DEFAULT,
    STRAVA_REDIRECT_URI_DEFAULT,
} from '../constant';

/**
 *  strava关联佳明国际区账号后可以由佳明国际区同步到strava，此方法暂时废弃
 */

const STRAVA_ACCESS_TOKEN = process.env.STRAVA_ACCESS_TOKEN ?? STRAVA_ACCESS_TOKEN_DEFAULT;
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID ?? STRAVA_CLIENT_ID_DEFAULT;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET ?? STRAVA_CLIENT_SECRET_DEFAULT;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI ?? STRAVA_REDIRECT_URI_DEFAULT;

// 重新配置strava
strava.config({
    'access_token': STRAVA_ACCESS_TOKEN,
    'client_id': STRAVA_CLIENT_ID,
    'client_secret': STRAVA_CLIENT_SECRET,
    'redirect_uri': STRAVA_REDIRECT_URI,
});

// 确保token是最新的
if (STRAVA_ACCESS_TOKEN) {
    strava.config({
        'access_token': STRAVA_ACCESS_TOKEN
    });
}

export const getStravaUserInfo = async () => {
    console.log('STRAVA_ACCESS_TOKEN',STRAVA_ACCESS_TOKEN);

    try {
        // 使用axios直接调用Strava API
        const axios = require('axios');
        const response = await axios.get('https://www.strava.com/api/v3/athlete', {
            headers: {
                'Authorization': `Bearer ${STRAVA_ACCESS_TOKEN}`
            }
        });
        
        console.log('Strava用户信息:', response.data);
        return response.data;
    } catch (error) {
        console.error('Strava API调用失败:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 上传活动文件到Strava
 * @param filePath 活动文件路径
 * @param activityName 活动名称
 * @param activityDescription 活动描述
 * @param activityType 活动类型
 */
export const uploadActivityToStrava = async (
    filePath: string, 
    activityName?: string, 
    activityDescription?: string,
    activityType?: string
): Promise<any> => {
    try {
        const fs = require('fs');
        const FormData = require('form-data');
        const axios = require('axios');
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName?.split('.').pop()?.toLowerCase();

        // 根据文件扩展名确定数据类型
        let dataType = 'fit';
        if (fileExtension === 'gpx') {
            dataType = 'gpx';
        } else if (fileExtension === 'tcx') {
            dataType = 'tcx';
        }

        console.log(`正在上传活动到Strava: ${fileName}`);
        console.log(`文件类型: ${dataType}`);
        console.log(`活动名称: ${activityName || '未命名活动'}`);

        // 使用FormData和axios上传
        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: fileName,
            contentType: dataType === 'fit' ? 'application/octet-stream' : 
                        dataType === 'gpx' ? 'application/gpx+xml' : 
                        'application/vnd.garmin.tcx+xml'
        });
        form.append('name', activityName || 'Garmin Activity');
        form.append('description', activityDescription || '从佳明同步的活动');
        form.append('data_type', dataType);
        form.append('activity_type', activityType || 'Run');

        const uploadResult = await axios.post('https://www.strava.com/api/v3/uploads', form, {
            headers: {
                'Authorization': `Bearer ${STRAVA_ACCESS_TOKEN}`,
                ...form.getHeaders()
            }
        });

        console.log('Strava上传结果:', uploadResult.data);
        return uploadResult.data;
    } catch (error) {
        console.error('Strava上传失败:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 检查Strava上传状态
 * @param uploadId 上传ID
 */
export const checkUploadStatus = async (uploadId: string): Promise<any> => {
    try {
        const axios = require('axios');
        const response = await axios.get(`https://www.strava.com/api/v3/uploads/${uploadId}`, {
            headers: {
                'Authorization': `Bearer ${STRAVA_ACCESS_TOKEN}`
            }
        });
        console.log('上传状态:', response.data);
        return response.data;
    } catch (error) {
        console.error('检查上传状态失败:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * 获取Strava活动列表
 * @param perPage 每页数量
 * @param page 页码
 */
export const getStravaActivities = async (perPage: number = 1, page: number = 1): Promise<any> => {
    try {
        const activities = await strava.athlete.activities({ per_page: perPage, page: page });
        return activities;
    } catch (error) {
        console.error('获取Strava活动列表失败:', error);
        throw error;
    }
};
