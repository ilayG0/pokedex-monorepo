const { randomUUID } = require('crypto');

const TURN_DURATION_MS = 30_000;

const battles = new Map();

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function createPlayerState({ userId, pokemonId, pokemonName, moves }) {
  return {
    userId,
    pokemonId,
    pokemonName,
    maxHp: 100,
    currentHp: 100,
    moves: (moves || []).map((m, index) => ({
      id: m.id ?? m.moveId ?? index,
      name: m.name ?? m.move?.name ?? `Move-${index + 1}`,
      power: typeof m.power === 'number' ? m.power : 25,
    })),
  };
}

function getOtherPlayerId(battle, userId) {
  const [p1, p2] = battle.players;
  return p1.userId === userId ? p2.userId : p1.userId;
}

function getPlayer(battle, userId) {
  return battle.players.find((p) => p.userId === userId) || null;
}

function getBattleById(battleId) {
  return battles.get(battleId) || null;
}

async function createBattle({ player1, player2 }) {
  const id = randomUUID ? randomUUID() : `battle_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const p1 = createPlayerState(player1);
  const p2 = createPlayerState(player2);

  const starter =
    Math.random() < 0.5 ? p1.userId : p2.userId;

  const now = Date.now();

  const battleState = {
    id,
    players: [p1, p2],
    activePlayerId: starter,
    turnNumber: 1,
    turnExpiresAt: now + TURN_DURATION_MS,
    status: 'ACTIVE',
    winnerId: null,
  };

  battles.set(id, battleState);

  return cloneState(battleState);
}

async function joinBattle({ battleId, userId }) {
  const battle = battles.get(battleId);
  if (!battle) {
    throw new Error('Battle not found');
  }

  const player = getPlayer(battle, userId);
  if (!player) {
    throw new Error('User not part of this battle');
  }

  return cloneState(battle);
}

async function applyAction({ battleId, userId, action }) {
  const battle = battles.get(battleId);
  if (!battle) {
    throw new Error('Battle not found');
  }

  const events = [];

  if (battle.status !== 'ACTIVE') {
    return { state: cloneState(battle), events };
  }

  if (userId !== battle.activePlayerId) {
    events.push({
      type: 'NOT_YOUR_TURN',
      playerId: userId,
    });
    return { state: cloneState(battle), events };
  }

  const now = Date.now();
  if (now > battle.turnExpiresAt) {
    const nextPlayerId = getOtherPlayerId(battle, userId);
    battle.activePlayerId = nextPlayerId;
    battle.turnNumber += 1;
    battle.turnExpiresAt = now + TURN_DURATION_MS;

    events.push({
      type: 'TURN_TIMEOUT',
      playerId: userId,
    });
    events.push({
      type: 'TURN_CHANGED',
      activePlayerId: nextPlayerId,
      turnNumber: battle.turnNumber,
      turnExpiresAt: battle.turnExpiresAt,
    });

    return { state: cloneState(battle), events };
  }

  const attacker = getPlayer(battle, userId);
  const defender = getPlayer(battle, getOtherPlayerId(battle, userId));

  if (!attacker || !defender) {
    throw new Error('Invalid battle players');
  }

  if (!action || !action.type) {
    events.push({ type: 'INVALID_ACTION', playerId: userId });
    return { state: cloneState(battle), events };
  }

  if (action.type === 'ATTACK') {
    const move = attacker.moves.find((m) => m.id === action.moveId) ?? attacker.moves[0];

    const basePower = typeof move.power === 'number' ? move.power : 25;
    const variance = 0.85 + Math.random() * 0.3;
    const damage = Math.max(1, Math.round(basePower * variance));

    const hpBefore = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    events.push({
      type: 'ATTACK',
      from: attacker.userId,
      to: defender.userId,
      moveId: move.id,
      moveName: move.name,
    });

    events.push({
      type: 'DAMAGE',
      target: defender.userId,
      amount: damage,
      hpBefore,
      hpAfter: defender.currentHp,
    });

    if (defender.currentHp <= 0) {
      battle.status = 'FINISHED';
      battle.winnerId = attacker.userId;

      events.push({
        type: 'BATTLE_FINISHED',
        winnerId: attacker.userId,
      });
    } else {
      const nextPlayerId = defender.userId;
      battle.activePlayerId = nextPlayerId;
      battle.turnNumber += 1;
      battle.turnExpiresAt = Date.now() + TURN_DURATION_MS;

      events.push({
        type: 'TURN_CHANGED',
        activePlayerId: nextPlayerId,
        turnNumber: battle.turnNumber,
        turnExpiresAt: battle.turnExpiresAt,
      });
    }
  } else {
    events.push({
      type: 'UNKNOWN_ACTION',
      playerId: userId,
      action,
    });
  }

  battles.set(battleId, battle);

  return {
    state: cloneState(battle),
    events,
  };
}

const battleService = {
  createBattle,
  joinBattle,
  applyAction,
  getBattleById,
};

module.exports = { battleService };