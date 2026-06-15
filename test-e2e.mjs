import { io } from 'socket.io-client';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api/v1' });

async function run() {
  console.log('Logging in...');
  let loginRes = await api.post('/auth/login', { email: 'test_n2n@agmk.uz', password: 'password123' }).catch(e => e.response);
  if (!loginRes.data.success) {
    console.log('Login failed', loginRes.data);
    process.exit(1);
  }
  
  if (loginRes.data.data && loginRes.data.data.maxDevicesReached) {
    const removeSessionId = loginRes.data.data.devices[0].sessionId;
    console.log(`Max devices reached, kicking out session ${removeSessionId}...`);
    loginRes = await api.post('/auth/login', { email: 'test_n2n@agmk.uz', password: 'password123', removeSessionId }).catch(e => e.response);
  }

  const user = loginRes.data.user || (loginRes.data.data ? loginRes.data.data.user : null);
  const token = loginRes.data.accessToken || (loginRes.data.data ? loginRes.data.data.accessToken : null);
  
  if (!user) {
    console.log('User not found in response:', loginRes.data);
    process.exit(1);
  }
  
  console.log(`Logged in as ${user.firstName}. Current Level: ${user.level}, XP: ${user.xp}`);
  
  console.log('Connecting socket...');
  const socket = io('ws://localhost:3000/realtime', {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => console.log('Socket connected!'));
  socket.on('level_up', (data) => {
    console.log('\n🎉 LEVEL UP EVENT RECEIVED!', data);
    console.log(`Congratulations! New Level: ${data.newLevel}, New Title: ${data.newTitle}\n`);
  });
  socket.on('leaderboard.my_points_updated', (data) => console.log('Points updated!', data.xp, 'XP'));

  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  console.log(`Sending progress updates (10 XP each)...`);
  for (let i = 0; i < 11; i++) {
    await api.get(`/leaderboard/test-gamification`);
    console.log(`Triggered gamification event ${i+1}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  setTimeout(() => {
    console.log('Test complete. Exiting.');
    process.exit(0);
  }, 2000);
}

run().catch(console.error);
