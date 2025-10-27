async function $FUNC_CALCULATE_PIT_EARNINGS(matchId, userId, isWinner, matchType) {
  // Try to find player by userId first, then by summonerName
  let userStats = await $ENTITY('players').list({ userId: userId });
  if (userStats.length === 0) {
    // Try finding by summonerName if userId didn't work
    userStats = await $ENTITY('players').list({ summonerName: userId });
  }
  
  const wins = userStats.length > 0 ? userStats[0].wins : 0;
  
  // Determine tier multiplier based on wins
  let tierMultiplier = 1.0; // Iron (0-2 wins)
  if (wins >= 101) {
    tierMultiplier = 5.0; // Master
  } else if (wins >= 51) {
    tierMultiplier = 3.0; // Diamond
  } else if (wins >= 21) {
    tierMultiplier = 2.0; // Platinum
  } else if (wins >= 11) {
    tierMultiplier = 1.5; // Gold
  } else if (wins >= 6) {
    tierMultiplier = 1.25; // Silver
  } else if (wins >= 3) {
    tierMultiplier = 1.1; // Bronze
  }
  
  const baseWinAmount = 20000;
  const baseLossAmount = 5000;
  
  if (isWinner) {
    return baseWinAmount * tierMultiplier;
  } else {
    return baseLossAmount * tierMultiplier;
  }
}

async function $FUNC_CALCULATE_RANKED_PIT(rank, isWin) {
  const baseWinAmount = 15000;
  const baseLossAmount = 3000;
  
  let rankMultiplier = 1.0;
  
  if (rank.includes('Challenger')) {
    rankMultiplier = 3.0;
  } else if (rank.includes('Grandmaster')) {
    rankMultiplier = 2.5;
  } else if (rank.includes('Master')) {
    rankMultiplier = 2.0;
  } else if (rank.includes('Diamond')) {
    rankMultiplier = 1.75;
  } else if (rank.includes('Platinum')) {
    rankMultiplier = 1.5;
  } else if (rank.includes('Gold')) {
    rankMultiplier = 1.25;
  } else if (rank.includes('Silver')) {
    rankMultiplier = 1.1;
  }
  
  if (isWin) {
    return baseWinAmount * rankMultiplier;
  } else {
    return baseLossAmount * rankMultiplier;
  }
}

async function $FUNC_CAN_BET(matchId) {
  const match = await $ENTITY('aram_matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'betting') {
    return false;
  }
  if ($USER_ID === match.player1Id || $USER_ID === match.player2Id) {
    return false;
  }
  const existingBet = await $ENTITY('aram_bets').exists({ matchId: matchId, bettorId: $USER_ID });
  return !existingBet;
}

async function $FUNC_CAN_BET_ARENA(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'betting') {
    return false;
  }
  if ($USER_ID === match.player1Id || $USER_ID === match.player2Id) {
    return false;
  }
  const existingBet = await $ENTITY('arena_bets').exists({ matchId: matchId, bettorId: $USER_ID });
  return !existingBet;
}

async function $FUNC_CAN_CLAIM_BOT_REWARD(botId) {
  const bot = await $ENTITY('bots').get(botId);
  if (!bot) {
    return false;
  }
  const userStats = await $ENTITY('players').get({ userId: $USER_ID });
  if (!userStats) {
    return false;
  }
  if (userStats.wins <= bot.wins) {
    return false;
  }
  const existingReward = await $ENTITY('bot_rewards').exists({ botId: botId, userId: $USER_ID });
  return !existingReward;
}

async function $FUNC_CAN_CREATE_ARENA_PICK(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'picking') {
    return false;
  }
  if ($USER_ID !== match.player1Id && $USER_ID !== match.player2Id) {
    return false;
  }
  const existingPick = await $ENTITY('arena_picks').exists({ matchId: matchId, playerId: $USER_ID });
  return !existingPick;
}

async function $FUNC_CAN_CREATE_PICK(matchId) {
  const match = await $ENTITY('aram_matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'picking') {
    return false;
  }
  if ($USER_ID !== match.player1Id && $USER_ID !== match.player2Id) {
    return false;
  }
  const existingPick = await $ENTITY('aram_picks').exists({ matchId: matchId, playerId: $USER_ID });
  return !existingPick;
}

async function $FUNC_CAN_VIEW_ARENA_PICKS(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status === 'betting' || match.status === 'completed') {
    return true;
  }
  if ($USER_ID === $OWNER_ID) {
    return true;
  }
  return false;
}

async function $FUNC_CAN_VIEW_PICKS(matchId) {
  const match = await $ENTITY('aram_matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status === 'betting' || match.status === 'completed') {
    return true;
  }
  if ($USER_ID === $OWNER_ID) {
    return true;
  }
  return false;
}

async function $FUNC_CAN_WITHDRAW(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.winnerId !== $USER_ID) {
    return false;
  }
  if (match.status !== 'completed') {
    return false;
  }
  const existingWithdrawal = await $ENTITY('withdrawals').exists({ matchId: matchId });
  return !existingWithdrawal;
}

async function $FUNC_CAN_WITHDRAW_ARAM(matchId) {
  const match = await $ENTITY('aram_matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'completed') {
    return false;
  }
  const existingWithdrawal = await $ENTITY('aram_withdrawals').exists({ matchId: matchId, userId: $USER_ID });
  if (existingWithdrawal) {
    return false;
  }
  if (match.winnerId === $USER_ID) {
    return true;
  }
  const userBet = await $ENTITY('aram_bets').exists({ matchId: matchId, bettorId: $USER_ID, predictedWinnerId: match.winnerId });
  return userBet;
}

async function $FUNC_CAN_WITHDRAW_ARENA_BET(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  if (!match) {
    return false;
  }
  if (match.status !== 'completed') {
    return false;
  }
  const existingWithdrawal = await $ENTITY('arena_withdrawals').exists({ matchId: matchId, userId: $USER_ID });
  if (existingWithdrawal) {
    return false;
  }
  if (match.winnerId === $USER_ID) {
    return true;
  }
  const userBet = await $ENTITY('arena_bets').exists({ matchId: matchId, bettorId: $USER_ID, predictedWinnerId: match.winnerId });
  return userBet;
}

async function $FUNC_CAN_WITHDRAW_DEV_FEES(amount) {
  if ($USER_ID !== $OWNER_ID) {
    return false;
  }
  if (amount <= 0) {
    return false;
  }
  const vaultBalance = await $GET_BALANCE($VAULT_ADDRESS, $TOKEN_SOL);
  if (amount > vaultBalance) {
    return false;
  }
  const minimumReserve = 0.1;
  if (vaultBalance - amount < minimumReserve) {
    return false;
  }
  return true;
}

async function $FUNC_GET_ARAM_WITHDRAWAL_AMOUNT(matchId) {
  const match = await $ENTITY('aram_matches').get(matchId);
  let totalAmount = 0;
  if (match.winnerId === $USER_ID) {
    const winnerStats = await $ENTITY('players').get({ userId: $USER_ID });
    const winnerWins = winnerStats ? winnerStats.wins : 0;
    const devFee = await $FUNC_GET_DEV_FEE_BY_WINS(winnerWins);
    const feeMultiplier = 1 - devFee;
    
    totalAmount = match.betAmount * 2 * feeMultiplier;
    
    const allBets = await $ENTITY('aram_bets').list({ matchId: matchId });
    const winningBets = allBets.filter(bet => bet.predictedWinnerId === match.winnerId);
    const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalLosingBets = allBets.filter(bet => bet.predictedWinnerId !== match.winnerId).reduce((sum, bet) => sum + bet.betAmount, 0);
    
    let totalBettorPayouts = 0;
    for (const bet of winningBets) {
      const userShare = bet.betAmount / totalWinningBets;
      const rawPayout = bet.betAmount + totalLosingBets * userShare;
      totalBettorPayouts += rawPayout;
    }
    
    const bettorBonus = totalBettorPayouts * 0.025;
    return totalAmount + bettorBonus;
  } else {
    const userBet = await $ENTITY('aram_bets').get({ matchId: matchId, bettorId: $USER_ID});
    const allBets = await $ENTITY('aram_bets').list({ matchId: matchId });
    const winningBets = allBets.filter(bet => bet.predictedWinnerId === match.winnerId);
    const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalLosingBets = allBets.filter(bet => bet.predictedWinnerId !== match.winnerId).reduce((sum, bet) => sum + bet.betAmount, 0);
    const userShare = userBet.betAmount / totalWinningBets;
    totalAmount = userBet.betAmount + totalLosingBets * userShare;
    return totalAmount * 0.9;
  }
}

async function $FUNC_GET_ARENA_BET_WITHDRAWAL_AMOUNT(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  let totalAmount = 0;
  if (match.winnerId === $USER_ID) {
    totalAmount = match.betAmount * 2;
  } else {
    const userBet = await $ENTITY('arena_bets').get({ matchId: matchId, bettorId: $USER_ID });
    const allBets = await $ENTITY('arena_bets').list({ matchId: matchId });
    const winningBets = allBets.filter(bet => bet.predictedWinnerId === match.winnerId);
    const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.betAmount, 0);
    const totalLosingBets = allBets.filter(bet => bet.predictedWinnerId !== match.winnerId).reduce((sum, bet) => sum + bet.betAmount, 0);
    const userShare = userBet.betAmount / totalWinningBets;
    totalAmount = userBet.betAmount + totalLosingBets * userShare;
  }
  return totalAmount * 0.9;
}

async function $FUNC_GET_BOT_REWARD_AMOUNT(botId) {
  const bot = await $ENTITY('bots').get(botId);
  return bot.rewardAmount;
}

async function $FUNC_GET_DEV_FEE_BY_WINS(wins) {
  if (wins >= 101) {
    return 0.015;
  } else if (wins >= 51) {
    return 0.025;
  } else if (wins >= 21) {
    return 0.05;
  } else if (wins >= 11) {
    return 0.0625;
  } else if (wins >= 6) {
    return 0.075;
  } else if (wins >= 3) {
    return 0.0875;
  } else {
    return 0.10;
  }
}

async function $FUNC_GET_TRANSFER_AMOUNT(betAmount) {
  return betAmount > 0 ? betAmount : 0;
}

async function $FUNC_GET_WITHDRAWAL_AMOUNT(matchId) {
  const match = await $ENTITY('matches').get(matchId);
  const winnerStats = await $ENTITY('players').get({ userId: match.winnerId });
  const winnerWins = winnerStats ? winnerStats.wins : 0;
  const devFee = await $FUNC_GET_DEV_FEE_BY_WINS(winnerWins);
  const feeMultiplier = 1 - devFee;
  
  const basePayout = match.betAmount * 2 * feeMultiplier;
  
  const allBets = await $ENTITY('arena_bets').list({ matchId: matchId });
  const winningBets = allBets.filter(bet => bet.predictedWinnerId === match.winnerId);
  const totalWinningBets = winningBets.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalLosingBets = allBets.filter(bet => bet.predictedWinnerId !== match.winnerId).reduce((sum, bet) => sum + bet.betAmount, 0);
  
  let totalBettorPayouts = 0;
  for (const bet of winningBets) {
    const userShare = bet.betAmount / totalWinningBets;
    const rawPayout = bet.betAmount + totalLosingBets * userShare;
    totalBettorPayouts += rawPayout;
  }
  
  const bettorBonus = totalBettorPayouts * 0.025;
  return basePayout + bettorBonus;
}

async function $FUNC_IS_FOUNDER() {
  const count = await $ENTITY('lol_accounts').count();
  return count < 10;
}