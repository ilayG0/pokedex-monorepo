const { battleService } = require('../services/battle.service');

function registerBattleHandlers(io, socket) {
  socket.on('battle:join', async ({ battleId }) => {
    try {
      console.log('🟢 battle:join from', socket.id, 'battleId:', battleId);
      const state = await battleService.joinBattle({
        battleId,
        userId: socket.id,
      });

      socket.join(battleId);
      io.to(battleId).emit('battle:state', state);
    } catch (err) {
      console.error('battle:join error', err);
      socket.emit('battle:error', { message: err.message || 'Failed to join battle' });
    }
  });

  socket.on('battle:action', async ({ battleId, action }) => {
    try {
      console.log('⚔️ battle:action from', socket.id, 'battleId:', battleId, 'action:', action);

      const result = await battleService.applyAction({
        battleId,
        userId: socket.id,
        action,
      });

      io.to(battleId).emit('battle:state', result.state);
      if (result.events?.length) {
        io.to(battleId).emit('battle:events', result.events);
      }
    } catch (err) {
      console.error('battle:action error', err);
      socket.emit('battle:error', { message: err.message || 'Failed to apply action' });
    }
  });

  socket.on('disconnect', async () => {
  });
}

module.exports = { registerBattleHandlers };
