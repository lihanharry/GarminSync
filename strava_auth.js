const http = require('http');
const axios = require('axios');
const url = require('url');

const CLIENT_ID = '178783';
const CLIENT_SECRET = '37f0a6bd2220bccaf9aafbe8e2f615526122886e';
const REDIRECT_URI = 'http://localhost:3000/callback';

console.log('\n请在浏览器中打开以下 URL 进行授权：');
console.log(`\nhttps://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&approval_prompt=force&scope=read,activity:write\n`);

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code;
        
        if (!code) {
            res.writeHead(400);
            res.end('No code received');
            return;
        }
        
        try {
            // Exchange code for token
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code'
            });
            
            const { access_token, refresh_token, expires_at } = response.data;
            
            console.log('\n✅ 授权成功！');
            console.log('\n新的 Access Token:', access_token);
            console.log('新的 Refresh Token:', refresh_token);
            console.log('过期时间:', new Date(expires_at * 1000).toISOString());
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
                <html>
                <head><meta charset="utf-8"><title>授权成功</title></head>
                <body>
                    <h1>✅ Strava 授权成功！</h1>
                    <p>你现在可以关闭这个窗口了。</p>
                    <p>Access Token: <code>${access_token}</code></p>
                    <p>请返回终端查看完整信息。</p>
                </body>
                </html>
            `);
            
            setTimeout(() => {
                server.close();
                process.exit(0);
            }, 2000);
            
        } catch (error) {
            console.error('❌ 获取 token 失败:', error.response?.data || error.message);
            res.writeHead(500);
            res.end('Failed to exchange code for token');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3000, () => {
    console.log('🚀 HTTP 服务器已启动，监听端口 3000...\n');
});
