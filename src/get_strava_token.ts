const axios = require('axios');
import { 
    STRAVA_ACCESS_TOKEN_DEFAULT,
    STRAVA_CLIENT_ID_DEFAULT, 
    STRAVA_CLIENT_SECRET_DEFAULT, 
    STRAVA_REDIRECT_URI_DEFAULT 
} from './constant';

const STRAVA_ACCESS_TOKEN = process.env.STRAVA_ACCESS_TOKEN ?? STRAVA_ACCESS_TOKEN_DEFAULT;
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID ?? STRAVA_CLIENT_ID_DEFAULT;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET ?? STRAVA_CLIENT_SECRET_DEFAULT;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI ?? STRAVA_REDIRECT_URI_DEFAULT;

/**
 * 获取Strava Access Token的辅助脚本
 */
async function getStravaToken() {
    console.log('🔑 开始获取Strava Access Token...\n');
    
    // 检查配置
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
        console.error('❌ 请先配置Strava Client ID和Client Secret');
        console.log('在 src/constant.ts 中配置：');
        console.log('export const STRAVA_CLIENT_ID_DEFAULT = "your_client_id";');
        console.log('export const STRAVA_CLIENT_SECRET_DEFAULT = "your_client_secret";');
        return;
    }
    
    if (!STRAVA_REDIRECT_URI) {
        console.error('❌ 请先配置Strava Redirect URI');
        console.log('在 src/constant.ts 中配置：');
        console.log('export const STRAVA_REDIRECT_URI_DEFAULT = "http://localhost";');
        return;
    }
    
    // 生成授权URL
    const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${STRAVA_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${STRAVA_REDIRECT_URI}&` +
        `scope=activity:write,read`;
    
    console.log('📋 请按以下步骤操作：\n');
    console.log('1️⃣ 在浏览器中打开以下URL：');
    console.log(authUrl);
    console.log('\n2️⃣ 登录你的Strava账号');
    console.log('3️⃣ 点击 "Authorize" 授权');
    console.log('4️⃣ 页面会跳转到重定向URI，从URL中复制授权码');
    console.log('\n请输入授权码：');
    
    // 等待用户输入授权码
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('授权码: ', async (authorizationCode) => {
        try {
            console.log('\n🔄 正在交换Access Token...');
            
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: STRAVA_CLIENT_ID,
                client_secret: STRAVA_CLIENT_SECRET,
                code: authorizationCode,
                grant_type: 'authorization_code'
            });
            
            console.log('\n✅ 成功获取Access Token！\n');
            console.log('📋 请将以下信息配置到 src/constant.ts 中：\n');
            console.log(`export const STRAVA_ACCESS_TOKEN_DEFAULT = '${response.data.access_token}';`);
            console.log(`export const STRAVA_CLIENT_ID_DEFAULT = '${STRAVA_CLIENT_ID}';`);
            console.log(`export const STRAVA_CLIENT_SECRET_DEFAULT = '${STRAVA_CLIENT_SECRET}';`);
            console.log(`export const STRAVA_REDIRECT_URI_DEFAULT = '${STRAVA_REDIRECT_URI}';`);
            
            console.log('\n📊 Token信息：');
            console.log(`Access Token: ${response.data.access_token}`);
            console.log(`Token Type: ${response.data.token_type}`);
            console.log(`Expires At: ${new Date(response.data.expires_at * 1000).toLocaleString()}`);
            console.log(`Refresh Token: ${response.data.refresh_token}`);
            console.log(`Athlete: ${response.data.athlete.firstname} ${response.data.athlete.lastname}`);
            
        } catch (error) {
            console.error('\n❌ 获取Access Token失败:', error.response?.data || error.message);
            console.log('\n请检查：');
            console.log('1. 授权码是否正确');
            console.log('2. Client ID和Client Secret是否正确');
            console.log('3. 网络连接是否正常');
        }
        
        rl.close();
    });
}

/**
 * 测试Strava连接
 */
async function testStravaConnection() {
    console.log('🧪 测试Strava连接...\n');
    
    if (!STRAVA_ACCESS_TOKEN) {
        console.error('❌ 请先配置Strava Access Token');
        return;
    }
    
    try {
        const response = await axios.get('https://www.strava.com/api/v3/athlete', {
            headers: {
                'Authorization': `Bearer ${STRAVA_ACCESS_TOKEN}`
            }
        });
        
        console.log('✅ Strava连接成功！');
        console.log(`运动员: ${response.data.firstname} ${response.data.lastname}`);
        console.log(`用户名: ${response.data.username}`);
        console.log(`ID: ${response.data.id}`);
        
    } catch (error) {
        console.error('❌ Strava连接失败:', error.response?.data || error.message);
        console.log('请检查Access Token是否正确');
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'get':
        getStravaToken();
        break;
    case 'test':
        testStravaConnection();
        break;
    default:
        console.log('🔑 Strava Token管理工具\n');
        console.log('使用方法:');
        console.log('  yarn get_strava_token get    - 获取新的Access Token');
        console.log('  yarn get_strava_token test   - 测试当前Token是否有效');
        console.log('');
        console.log('注意: 请先配置Client ID和Client Secret');
        break;
}
