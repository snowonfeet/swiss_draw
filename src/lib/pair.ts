export const getWinnerId = (pair: Pair) => {
  switch (pair.winner) {
    case "left":
      return pair.left;
    case "right":
      return pair.right;
    case "none":
      return undefined;
  }
};

export const getSide = (pair: Pair, id: PlayerId): Winner => {
  if (pair.left === id) {
    return "left";
  } else if (pair.right === id) {
    return "right";
  } else {
    return "none";
  }
};

export const getOpponentId = (pair: Pair, id: PlayerId) => {
  if (pair.left === id) {
    return pair.right;
  } else if (pair.right === id) {
    return pair.left;
  } else {
    return undefined;
  }
};

export const existPair = (
  left: PlayerId,
  right: PlayerId,
  pair: Pair
): boolean => {
  if (pair.left === left && pair.right === right) {
    return true;
  }
  if (pair.right === left && pair.right === right) {
    return true;
  }
  return false;
};

export const hasPlayerInPair = (playerId: PlayerId, pair: Pair) => {
  return pair.left === playerId || pair.right === playerId;
};

export const getResult = (
  pair: Pair,
  playerId: PlayerId
): "win" | "lose" | "none" => {
  if (pair.winner === "none") {
    return "none";
  }
  const side = getSide(pair, playerId);
  if (side === "none") {
    return "none";
  }

  if (side === pair.winner) {
    return "win";
  } else {
    return "lose";
  }
};
