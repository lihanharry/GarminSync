import {
    GARMIN_PASSWORD_DEFAULT,
    GARMIN_USERNAME_DEFAULT,
} from '../constant';
import { GarminClientType } from './type';
const core = require('@actions/core');
import _ from 'lodash';
import { getSessionFromDB, initDB, saveSessionToDB, updateSessionToDB } from './sqlite';

// 设置Node.js兼容性
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { GarminConnect } = require('@gooin/garmin-connect');

const GARMIN_USERNAME = process.env.GARMIN_USERNAME ?? GARMIN_USERNAME_DEFAULT;
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD ?? GARMIN_PASSWORD_DEFAULT;

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
            await GCClient.login();
            await saveSessionToDB('CN', GCClient.exportToken());
        } else {
            //  Wrap error message in GCClient, prevent terminate in github actions.
            try {
                console.log('GarminCN: login by saved session');
                await GCClient.loadToken(currentSession.oauth1, currentSession.oauth2);
            } catch (e) {
                console.log('Warn: renew  GarminCN Session..');
                await GCClient.login(GARMIN_USERNAME, GARMIN_PASSWORD);
                await updateSessionToDB('CN', GCClient.sessionJson);
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