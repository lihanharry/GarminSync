const { GarminConnect } = require('garmin-connect');

async function testAlternativeGarminConnect() {
    console.log('🔍 测试替代的garmin-connect库...\n');
    
    const username = '21755447@qq.com';
    const password = 'Lihan8832741';
    
    try {
        console.log('1️⃣ 创建GarminConnect实例...');
        const GCClient = new GarminConnect({
            username: username,
            password: password
        });
        console.log('✅ 实例创建成功');
        
        console.log('\n2️⃣ 尝试登录...');
        await GCClient.login();
        console.log('✅ 登录成功！');
        
        console.log('\n3️⃣ 获取用户信息...');
        const userInfo = await GCClient.getUserProfile();
        console.log('✅ 用户信息获取成功:');
        console.log('姓名:', userInfo.fullName);
        console.log('邮箱:', userInfo.emailAddress);
        
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
        
        console.log('\n🎉 替代库连接成功！');
        return true;
        
    } catch (error) {
        console.error('❌ 替代库连接失败:');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        return false;
    }
}

testAlternativeGarminConnect().catch(console.error);
