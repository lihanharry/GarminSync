import { getGaminCNClient } from './utils/garmin_cn';
import { getGaminGlobalClient } from './utils/garmin_global';
import { getGaminGlobalClient as getGlobalClient } from './utils/garmin_global';

/**
 * 获取佳明Token的辅助脚本
 * 这个脚本会显示如何获取和保存佳明的OAuth token
 */
async function getGarminTokens() {
    console.log('🔑 开始获取佳明Token...\n');
    
    try {
        // 1. 获取中国区Token
        console.log('🇨🇳 获取佳明中国区Token...');
        const cnClient = await getGaminCNClient();
        const cnToken = cnClient.exportToken();
        console.log('✅ 中国区Token获取成功:');
        console.log('OAuth1 Token:', cnToken.oauth1);
        console.log('OAuth2 Token:', cnToken.oauth2);
        console.log('Session JSON:', JSON.stringify(cnToken, null, 2));
        console.log('');
        
        // 2. 获取国际区Token
        console.log('🌍 获取佳明国际区Token...');
        const globalClient = await getGaminGlobalClient();
        const globalToken = globalClient.exportToken();
        console.log('✅ 国际区Token获取成功:');
        console.log('OAuth1 Token:', globalToken.oauth1);
        console.log('OAuth2 Token:', globalToken.oauth2);
        console.log('Session JSON:', JSON.stringify(globalToken, null, 2));
        console.log('');
        
        // 3. 显示如何使用这些Token
        console.log('📋 如何使用这些Token:');
        console.log('1. 这些Token已经自动保存到SQLite数据库中');
        console.log('2. 下次运行时，系统会自动使用保存的Token');
        console.log('3. 如果Token过期，系统会自动重新登录并更新Token');
        console.log('4. 你不需要手动管理这些Token');
        
    } catch (error) {
        console.error('❌ 获取Token失败:', error.message);
        console.error('请检查:');
        console.error('1. 用户名和密码是否正确');
        console.error('2. 网络连接是否正常');
        console.error('3. 是否需要科学上网（国际区）');
    }
}

/**
 * 显示当前保存的Token信息
 */
async function showSavedTokens() {
    console.log('📱 显示当前保存的Token信息...\n');
    
    try {
        const { getSessionFromDB, initDB } = require('./utils/sqlite');
        
        await initDB();
        
        // 获取中国区Token
        const cnSession = await getSessionFromDB('CN');
        if (cnSession) {
            console.log('🇨🇳 中国区Token:');
            console.log('OAuth1:', cnSession.oauth1);
            console.log('OAuth2:', cnSession.oauth2);
            console.log('');
        } else {
            console.log('🇨🇳 中国区Token: 未找到');
        }
        
        // 获取国际区Token
        const globalSession = await getSessionFromDB('GLOBAL');
        if (globalSession) {
            console.log('🌍 国际区Token:');
            console.log('OAuth1:', globalSession.oauth1);
            console.log('OAuth2:', globalSession.oauth2);
            console.log('');
        } else {
            console.log('🌍 国际区Token: 未找到');
        }
        
    } catch (error) {
        console.error('❌ 获取保存的Token失败:', error.message);
    }
}

/**
 * 清除保存的Token（强制重新登录）
 */
async function clearTokens() {
    console.log('🗑️ 清除保存的Token...\n');
    
    try {
        const { getDB } = require('./utils/sqlite');
        const db = await getDB();
        
        // 删除中国区Token
        await db.run('DELETE FROM garmin_session WHERE region = ?', 'CN');
        console.log('✅ 中国区Token已清除');
        
        // 删除国际区Token
        await db.run('DELETE FROM garmin_session WHERE region = ?', 'GLOBAL');
        console.log('✅ 国际区Token已清除');
        
        console.log('🔄 下次运行时会重新登录并获取新Token');
        
    } catch (error) {
        console.error('❌ 清除Token失败:', error.message);
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'get':
        getGarminTokens();
        break;
    case 'show':
        showSavedTokens();
        break;
    case 'clear':
        clearTokens();
        break;
    default:
        console.log('🔑 佳明Token管理工具\n');
        console.log('使用方法:');
        console.log('  yarn get_garmin_token get    - 获取新的Token');
        console.log('  yarn get_garmin_token show   - 显示当前保存的Token');
        console.log('  yarn get_garmin_token clear  - 清除保存的Token');
        console.log('');
        console.log('注意: 通常你不需要手动管理Token，系统会自动处理');
        break;
}
