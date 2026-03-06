const strava = require('strava-v3');
const axios = require('axios');
import {
    STRAVA_ACCESS_TOKEN_DEFAULT,
    STRAVA_REFRESH_TOKEN_DEFAULT,
    STRAVA_TOKEN_EXPIRES_AT_DEFAULT,
    STRAVA_CLIENT_ID_DEFAULT,
    STRAVA_CLIENT_SECRET_DEFAULT,
    STRAVA_REDIRECT_URI_DEFAULT,
} from '../constant';
import { getStravaTokenFromDB, saveStravaTokenToDB, initDB } from './sqlite';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID ?? STRAVA_CLIENT_ID_DEFAULT;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET ?? STRAVA_CLIENT_SECRET_DEFAULT;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI ?? STRAVA_REDIRECT_URI_DEFAULT;

// .env 中的初始值，作为首次运行的种子
const INITIAL_ACCESS_TOKEN = process.env.STRAVA_ACCESS_TOKEN ?? STRAVA_ACCESS_TOKEN_DEFAULT;
const INITIAL_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN ?? STRAVA_REFRESH_TOKEN_DEFAULT;
const INITIAL_EXPIRES_AT = parseInt(process.env.STRAVA_TOKEN_EXPIRES_AT || '0') || STRAVA_TOKEN_EXPIRES_AT_DEFAULT;

/**
 * 获取有效的 Strava access token，过期时自动刷新
 */
const getValidAccessToken = async (): Promise<string> => {
    await initDB();

    // 优先从 DB 读取（DB 中存的是最新刷新后的 token）
    let tokenData = await getStravaTokenFromDB();

    // DB 中没有记录，用 .env 中的初始值作为种子写入
    if (!tokenData) {
        if (!INITIAL_REFRESH_TOKEN) {
            // 没有 refresh token，退回使用静态 access token
            if (INITIAL_ACCESS_TOKEN) {
                console.log('Strava: 使用静态 access_token（无 refresh_token，无法自动刷新）');
                return INITIAL_ACCESS_TOKEN;
            }
            throw new Error('缺少 STRAVA_REFRESH_TOKEN 和 STRAVA_ACCESS_TOKEN，请在 .env 中配置');
        }
        tokenData = {
            access_token: INITIAL_ACCESS_TOKEN,
            refresh_token: INITIAL_REFRESH_TOKEN,
            expires_at: INITIAL_EXPIRES_AT,
        };
        await saveStravaTokenToDB(tokenData.access_token, tokenData.refresh_token, tokenData.expires_at);
    }

    // 检查是否过期（提前 5 分钟刷新）
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.expires_at > 0 && tokenData.expires_at - 300 > now) {
        return tokenData.access_token;
    }

    // Token 过期或即将过期，刷新
    if (!tokenData.refresh_token) {
        console.log('Strava: token 已过期但没有 refresh_token，使用当前 access_token 尝试');
        return tokenData.access_token;
    }

    console.log('Strava: access_token 已过期，正在刷新...');
    try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: tokenData.refresh_token,
        });

        const { access_token, refresh_token, expires_at } = response.data;
        console.log('Strava: token 刷新成功，新过期时间:', new Date(expires_at * 1000).toLocaleString());

        await saveStravaTokenToDB(access_token, refresh_token, expires_at);
        return access_token;
    } catch (error) {
        console.error('Strava: token 刷新失败:', error.response?.data || error.message);
        throw new Error('Strava token 刷新失败，请检查 STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN');
    }
};

export const getStravaUserInfo = async () => {
    const accessToken = await getValidAccessToken();
    console.log('STRAVA_ACCESS_TOKEN', accessToken.substring(0, 8) + '...');

    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
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
 */
export const uploadActivityToStrava = async (
    filePath: string,
    activityName?: string,
    activityDescription?: string,
    activityType?: string
): Promise<any> => {
    const accessToken = await getValidAccessToken();

    try {
        const fs = require('fs');
        const FormData = require('form-data');

        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName?.split('.').pop()?.toLowerCase();

        let dataType = 'fit';
        if (fileExtension === 'gpx') {
            dataType = 'gpx';
        } else if (fileExtension === 'tcx') {
            dataType = 'tcx';
        }

        console.log(`正在上传活动到Strava: ${fileName}`);
        console.log(`文件类型: ${dataType}`);
        console.log(`活动名称: ${activityName || '未命名活动'}`);

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
                'Authorization': `Bearer ${accessToken}`,
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
 */
export const checkUploadStatus = async (uploadId: string): Promise<any> => {
    const accessToken = await getValidAccessToken();

    try {
        const response = await axios.get(`https://www.strava.com/api/v3/uploads/${uploadId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
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
 */
export const getStravaActivities = async (perPage: number = 1, page: number = 1): Promise<any> => {
    const accessToken = await getValidAccessToken();

    try {
        // 配置 strava 库使用最新 token
        strava.config({
            'access_token': accessToken,
            'client_id': STRAVA_CLIENT_ID,
            'client_secret': STRAVA_CLIENT_SECRET,
            'redirect_uri': STRAVA_REDIRECT_URI,
        });
        const activities = await strava.athlete.activities({ per_page: perPage, page: page });
        return activities;
    } catch (error) {
        console.error('获取Strava活动列表失败:', error);
        throw error;
    }
};
