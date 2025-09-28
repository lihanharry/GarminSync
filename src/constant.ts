// 加载环境变量
require('dotenv').config();

export const FILE_SUFFIX = {
    FIT: 'fit',
    GPX: 'gpx',
    TCX: 'tcx',
};
export const DOWNLOAD_DIR = './garmin_fit_files';
export const DB_FILE_PATH = './db/garmin.db';
export const AESKEY_DEFAULT = 'LSKDAJALSD';

/**
 * GARMIN ACCOUNT
 */
// 佳明中国区账号及密码 - 从环境变量读取，如果没有则使用默认值
export const GARMIN_USERNAME_DEFAULT = process.env.GARMIN_USERNAME || '';
export const GARMIN_PASSWORD_DEFAULT = process.env.GARMIN_PASSWORD || '';
// 佳明国际区账号及密码 - 从环境变量读取，如果没有则使用默认值
export const GARMIN_GLOBAL_USERNAME_DEFAULT = process.env.GARMIN_GLOBAL_USERNAME || '';
export const GARMIN_GLOBAL_PASSWORD_DEFAULT = process.env.GARMIN_GLOBAL_PASSWORD || '';
// 佳明迁移数量配置 - 从环境变量读取
export const GARMIN_MIGRATE_NUM_DEFAULT = process.env.GARMIN_MIGRATE_NUM || '';
export const GARMIN_MIGRATE_START_DEFAULT = process.env.GARMIN_MIGRATE_START || '';
// 佳明每次同步时检查的最多的数量 - 从环境变量读取
export const GARMIN_SYNC_NUM_DEFAULT = parseInt(process.env.GARMIN_SYNC_NUM || '10');

export const GARMIN_URL_DEFAULT = {
    'BASE_URL': 'https://connect.garmin.cn',
    'ACTIVITY_URL': 'https://connect.garmin.cn/modern/activity/',
    'SSO_URL_ORIGIN': 'https://sso.garmin.com',
    'SSO_URL': 'https://sso.garmin.cn/sso',
    'MODERN_URL': 'https://connect.garmin.cn/modern',
    'SIGNIN_URL': 'https://sso.garmin.cn/sso/signin',
    'CSS_URL': 'https://static.garmincdn.cn/cn.garmin.connect/ui/css/gauth-custom-v1.2-min.css',
};

/**
 * GOOGLE ACCOUNT
 */
export const GOOGLE_API_CLIENT_EMAIL_DEFAULT = process.env.GOOGLE_API_CLIENT_EMAIL || '';
export const GOOGLE_API_PRIVATE_KEY_DEFAULT = process.env.GOOGLE_API_PRIVATE_KEY || '';
export const GOOGLE_SHEET_ID_DEFAULT = process.env.GOOGLE_SHEET_ID || '';

/**
 * RQ ACCOUNT
 */
export const RQ_USERID_DEFAULT = process.env.RQ_USERID || '';
export const RQ_COOKIE_DEFAULT = process.env.RQ_COOKIE || '';
export const RQ_CSRF_TOKEN_DEFAULT = process.env.RQ_CSRF_TOKEN || '';
export const RQ_USERNAME_DEFAULT = process.env.RQ_USERNAME || '';
export const RQ_PASSWORD_DEFAULT = process.env.RQ_PASSWORD || '';
export const RQ_HOST_DEFAULT = 'https://www.runningquotient.cn/';
export const UA_DEFAULT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36';
export const RQ_ROUTES_DEFAULT = {
    LOGIN: '/user/login',
    OVERVIEW: '/training/getOverView',
    UPDATE: 'training/update-overview?userId=',
};

export const BARK_KEY_DEFAULT = process.env.BARK_KEY || '';

/**
 * STRAVA ACCOUNT
 */
export const STRAVA_ACCESS_TOKEN_DEFAULT = process.env.STRAVA_ACCESS_TOKEN || '';
export const STRAVA_CLIENT_ID_DEFAULT = process.env.STRAVA_CLIENT_ID || '';
export const STRAVA_CLIENT_SECRET_DEFAULT = process.env.STRAVA_CLIENT_SECRET || '';
export const STRAVA_REDIRECT_URI_DEFAULT = process.env.STRAVA_REDIRECT_URI || 'http://localhost';


