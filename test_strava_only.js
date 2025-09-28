const axios = require('axios');

// Strava配置
const STRAVA_ACCESS_TOKEN = '10a66cac4ff7c82bca78c1d633d80216e71f7831';

async function testStravaConnection() {
    console.log('🧪 测试Strava连接...\n');
    
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
        
        return true;
    } catch (error) {
        console.error('❌ Strava连接失败:', error.response?.data || error.message);
        return false;
    }
}

async function testStravaUpload() {
    console.log('\n📤 测试Strava上传功能...\n');
    
    // 创建一个简单的测试文件
    const fs = require('fs');
    const testFilePath = './test_activity.gpx';
    
    // 创建一个简单的GPX文件用于测试
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Test Activity</name>
    <trkseg>
      <trkpt lat="39.9042" lon="116.4074">
        <time>2024-01-01T10:00:00Z</time>
      </trkpt>
      <trkpt lat="39.9043" lon="116.4075">
        <time>2024-01-01T10:01:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;
    
    try {
        // 写入测试文件
        fs.writeFileSync(testFilePath, gpxContent);
        console.log('✅ 测试文件创建成功');
        
        // 读取文件
        const fileBuffer = fs.readFileSync(testFilePath);
        
        // 上传到Strava
        console.log('⬆️ 上传测试活动到Strava...');
        
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: 'test_activity.gpx',
            contentType: 'application/gpx+xml'
        });
        form.append('name', 'Test Activity from GarminSync');
        form.append('description', '这是一个测试活动');
        form.append('data_type', 'gpx');
        form.append('activity_type', 'Run');
        
        const uploadResponse = await axios.post('https://www.strava.com/api/v3/uploads', form, {
            headers: {
                'Authorization': `Bearer ${STRAVA_ACCESS_TOKEN}`,
                ...form.getHeaders()
            }
        });
        
        console.log('✅ 上传成功！');
        console.log('上传ID:', uploadResponse.data.id);
        console.log('状态:', uploadResponse.data.status);
        
        // 清理测试文件
        fs.unlinkSync(testFilePath);
        console.log('✅ 测试文件已清理');
        
        return true;
        
    } catch (error) {
        console.error('❌ 上传失败:', error.response?.data || error.message);
        
        // 清理测试文件
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        
        return false;
    }
}

async function main() {
    console.log('🚀 开始测试Strava功能...\n');
    
    // 测试连接
    const connectionOk = await testStravaConnection();
    if (!connectionOk) {
        console.log('\n❌ Strava连接失败，无法继续测试');
        return;
    }
    
    // 测试上传
    const uploadOk = await testStravaUpload();
    if (uploadOk) {
        console.log('\n🎉 所有测试通过！Strava功能正常');
    } else {
        console.log('\n❌ 上传测试失败');
    }
}

main().catch(console.error);
