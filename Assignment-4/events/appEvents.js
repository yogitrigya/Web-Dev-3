const EventEmitter = require('events');

class AppEmitter extends EventEmitter {}
const appEvents = new AppEmitter();

appEvents.on('user:registered', (user) => {
  console.log(`[EVENT] New user registered: ${user.username} (${user.email})`);
});

appEvents.on('user:login', (user) => {
  console.log(`[EVENT] User logged in: ${user.username}`);
});

appEvents.on('note:created', ({ username, title }) => {
  console.log(`[EVENT] Note "${title}" created by ${username}`);
});

module.exports = appEvents;
