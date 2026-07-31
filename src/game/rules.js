export const DEFAULT_RULES = {
  startingCards: 5,
  stackingPenalties: true,
  allowMultiPlay: false,
  enablePick2: true,
  enablePick3: true,
  enableSuspension: true,
  enableHoldOn: true,
  enableGeneralMarket: true,
  allowDefendPick2: true,
  allowDefendPick3: true,
  whotCardPower: 'full',
};

export const isDefaultRules = (rules) => {
  if (!rules) return true;
  for (const [key, value] of Object.entries(DEFAULT_RULES)) {
    if (rules[key] !== value) return false;
  }
  return true;
};
