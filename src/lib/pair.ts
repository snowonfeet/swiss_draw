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
