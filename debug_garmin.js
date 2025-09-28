const { GarminConnect } = require('@gooin/garmin-connect');

async function debugGarminConnection() {
    console.log('🔍 开始调试佳明连接...\n');
    
    const username = '21755447@qq.com';
    const password = 'Lihan8832741';
    
    console.log('📋 配置信息:');
    console.log('用户名:', username);
    console.log('密码:', password.substring(0, 3) + '***');
    console.log('区域: garmin.cn\n');
    
    try {
        console.log('1️⃣ 创建GarminConnect实例...');
        const GCClient = new GarminConnect({username: username, password: password}, 'garmin.cn');
        console.log('✅ 实例创建成功');
        
        console.log('\n2️⃣ 尝试登录...');
        console.log('正在连接到佳明中国区服务器...');
        
        // 添加详细的错误处理
        try {
            await GCClient.login();
            console.log('✅ 登录成功！');
            
            console.log('\n3️⃣ 获取用户信息...');
            const userInfo = await GCClient.getUserProfile();
            console.log('✅ 用户信息获取成功:');
            console.log('姓名:', userInfo.fullName);
            console.log('邮箱:', userInfo.userName);
            console.log('位置:', userInfo.location);
            
            console.log('\n4️⃣ 获取活动列表...');
            const activities = await GCClient.getActivities(0, 1);
            console.log('✅ 活动列表获取成功:');
            console.log('活动数量:', activities.length);
            if (activities.length > 0) {
                console.log('最新活动:', {
                    id: activities[0].activityId,
                    name: activities[0].activityName,
                    startTime: activities[0].startTimeLocal,
                    type: activities[0].activityType?.typeKey
                });
            }
            
            console.log('\n🎉 佳明连接完全正常！');
            
        } catch (loginError) {
            console.error('❌ 登录失败:');
            console.error('错误类型:', loginError.constructor.name);
            console.error('错误消息:', loginError.message);
            console.error('错误堆栈:', loginError.stack);
            
            // 检查是否是网络相关错误
            if (loginError.message.includes('status')) {
                console.log('\n🔍 可能的原因:');
                console.log('1. 佳明服务器返回了意外的响应格式');
                console.log('2. 网络连接不稳定');
                console.log('3. 佳明API发生了变化');
            }
        }
        
    } catch (error) {
        console.error('❌ 创建连接失败:');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行调试
debugGarminConnection().catch(console.error);
