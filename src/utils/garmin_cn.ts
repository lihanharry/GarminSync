import {
    GARMIN_PASSWORD_DEFAULT,
    GARMIN_USERNAME_DEFAULT,
} from '../constant';
import { GarminClientType } from './type';
const core = require('@actions/core');
import _ from 'lodash';
import { getSessionFromDB, initDB, saveSessionToDB, updateSessionToDB } from './sqlite';
import * as readline from 'readline';

// 设置Node.js兼容性
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { GarminConnect } = require('@gooin/garmin-connect');

const GARMIN_USERNAME = process.env.GARMIN_USERNAME ?? GARMIN_USERNAME_DEFAULT;
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD ?? GARMIN_PASSWORD_DEFAULT;

/**
 * 从终端读取用户输入的 MFA 验证码
 */
const promptMFACode = (): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
    });
    return new Promise((resolve) => {
        rl.question('请输入佳明 MFA 验证码: ', (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
};

export const getGaminCNClient = async (): Promise<GarminClientType> => {
    if (_.isEmpty(GARMIN_USERNAME) || _.isEmpty(GARMIN_PASSWORD)) {
        const errMsg = '请填写中国区用户名及密码：GARMIN_USERNAME,GARMIN_PASSWORD';
        core.setFailed(errMsg);
        return Promise.reject(errMsg);
    }

    const GCClient = new GarminConnect({username: GARMIN_USERNAME, password: GARMIN_PASSWORD}, 'garmin.cn');

    try {
        await initDB();

        const currentSession = await getSessionFromDB('CN');
        if (!currentSession) {
            await loginWithMFA(GCClient);
            await saveSessionToDB('CN', GCClient.exportToken());
        } else {
            try {
                console.log('GarminCN: login by saved session');
                await GCClient.loadToken(currentSession.oauth1, currentSession.oauth2);
            } catch (e) {
                console.log('Warn: renew GarminCN Session..');
                await loginWithMFA(GCClient);
                await updateSessionToDB('CN', GCClient.exportToken());
            }
        }

        const userInfo = await GCClient.getUserProfile();
        const { fullName, userName: emailAddress, location } = userInfo;
        if (!fullName) {
            throw Error('佳明中国区登录失败')
        }
        console.log('Garmin userInfo CN: ', { fullName, emailAddress, location });

        return GCClient;
    } catch (err) {
        console.error(err);
        core.setFailed(err);
    }
};

/**
 * 带 MFA 支持的登录
 * 支持两种方式提供验证码：
 * 1. 环境变量 GARMIN_MFA_CODE（适合脚本调用）
 * 2. 终端交互输入（适合手动运行）
 */
const loginWithMFA = async (GCClient: any) => {
    const sessionId = `garmin_cn_${Date.now()}`;
    const { MFAManager } = require('@gooin/garmin-connect');
    const mfaManager = MFAManager.getInstance({ type: 'file', dir: '/tmp' });

    // 启动登录（带 sessionId，会在需要 MFA 时等待）
    const loginPromise = GCClient.login(GARMIN_USERNAME, GARMIN_PASSWORD, sessionId);

    // 轮询等待 MFA session 文件出现，然后提交验证码
    const submitMFA = async () => {
        // 等待 session 文件出现（最多 15 秒）
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const hasSession = await mfaManager.hasSession(sessionId);
            if (hasSession) {
                console.log('佳明账号需要 MFA 验证');
                const envCode = process.env.GARMIN_MFA_CODE;
                let code: string;
                if (envCode) {
                    console.log(`使用环境变量中的 MFA 验证码: ${envCode}`);
                    code = envCode;
                } else {
                    console.log('请输入验证码（查看邮箱或手机）:');
                    code = await promptMFACode();
                }
                await mfaManager.submitMFACode(sessionId, code);
                return;
            }
        }
        // 如果 15 秒内没有出现 MFA session，说明可能不需要 MFA
    };

    await Promise.all([loginPromise, submitMFA()]);
};
