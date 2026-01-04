const { authSocket } = require('./auth/authSocket');
const { registerBattleHandlers } = require('./battle.handlers');

module.exports = (io) => {
  const battleNsp = io.of('/battle');
  battleNsp.use(authSocket());

  battleNsp.on('connection', (socket) => {
    registerBattleHandlers(battleNsp, socket);
  });
};