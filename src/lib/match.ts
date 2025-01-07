import { ParaglidingOutlined } from "@mui/icons-material";
import { existPair, getOpponentId, getWinnerId, hasPlayerInPair } from "./pair";
import { roundRobin } from "./roundRobin";
import { isEven, makeId, shuffle } from "./util";
import { getPlayerName } from "./player";

const isPair = (arg: unknown): arg is Pair => {
  const record = arg as Record<keyof Pair, unknown>;
  return (
    record &&
    typeof record.id === "string" &&
    typeof record.left === "string" &&
    typeof record.right === "string" &&
    typeof record.winner === "string"
  );
};

const isPairs = (arg: unknown): arg is Pair[] => {
  return Array.isArray(arg) && arg.every(isPair);
};

const isMatch = (arg: unknown): arg is Match => {
  const record = arg as Record<keyof Match, unknown>;
  return typeof record.id === "string" && isPairs(record.pairList);
};

export const isMatches = (arg: unknown): arg is Match[] => {
  return Array.isArray(arg) && arg.every(isMatch);
};

export const getPlayerWinCount = (playerId: PlayerId, matches: Match[]) => {
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        count += 1;
        break;
      }
    }
  }
  return count;
};

// 特定の試合より前の勝ち数を取得する。
export const getPlayerWinCountUntilMatchId = (
  playerId: PlayerId,
  matchId: MatchId,
  matches: Match[]
) => {
  let count = 0;
  for (const match of matches) {
    if (match.id === matchId) {
      break;
    }

    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        count += 1;
        break;
      }
    }
  }
  return count;
};

// 対戦相手の勝ち数を取得する.
export const getOpponentWinCount = (id: PlayerId, matches: Match[]) => {
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      const opponentId = getOpponentId(pair, id);
      if (opponentId) {
        count += getPlayerWinCount(opponentId, matches);
        break;
      }
    }
  }
  return count;
};

// 勝った試合の対戦相手の勝ち数を取得する.
export const getDefeatedOpponentWinCount = (
  playerId: PlayerId,
  matches: Match[]
) => {
  let count = 0;
  for (const match of matches) {
    for (const pair of match.pairList) {
      if (getWinnerId(pair) === playerId) {
        const opponentId = getOpponentId(pair, playerId);
        if (opponentId) {
          count += getPlayerWinCount(opponentId, matches);
          break;
        } else {
          console.assert(false);
        }
      }
    }
  }
  return count;
};

const existPairInMatch = (
  left: PlayerId,
  right: PlayerId,
  match: Match
): boolean => {
  for (const pair of match.pairList) {
    if (existPair(left, right, pair)) {
      return true;
    }
  }
  return false;
};

const existPairInMatches = (
  left: PlayerId,
  right: PlayerId,
  matches: Match[]
) => {
  for (const match of matches) {
    if (existPairInMatch(left, right, match)) {
      return true;
    }
  }
  return false;
};

// 勝数の大きい順でソートした配列を返す.
const makeSortedPlayers = (players: Player[], matches: Match[]) => {
  return players.toSorted((a, b) => {
    const aWinCount = getPlayerWinCount(a.id, matches);
    const bWinCount = getPlayerWinCount(b.id, matches);
    const diff = bWinCount - aWinCount;
    if (diff !== 0) {
      return diff;
    }
    // 同じ勝数の場合はランダム。
    return Math.random() - 0.5;
  });
};

const toEven = (players: Player[], ghostPlayer: Player): Player[] => {
  return isEven(players) ? players : [...players];
};

export const swissDraw = (
  players: Player[],
  matches: Match[],
  ghostPlayer: Player
): Match | undefined => {
  const sortedPlayers = toEven(
    makeSortedPlayers(players, matches),
    ghostPlayer
  );

  const pairList = makePairRecursive(sortedPlayers, matches);
  if (pairList) {
    return {
      id: makeId() as MatchId,
      pairList: pairList,
    };
  } else {
    return undefined;
  }
};

const makePairRecursive = (
  players: Player[],
  matches: Match[]
): Pair[] | undefined => {
  if (players.length <= 1) {
    throw new Error(`required players.length >= 2 but ${players.length}`);
  }

  if (players.length % 2 !== 0) {
    throw new Error(`required players.length % 2 === 0 but ${players.length}`);
  }

  const player = players[0];
  const challengers = players.toSpliced(0, 1);
  for (let i = 0; i < challengers.length; ++i) {
    const challenger = challengers[i];
    if (!existPairInMatches(player.id, challenger.id, matches)) {
      const newPair: Pair = {
        id: makeId() as PairId,
        left: player.id,
        right: challenger.id,
        winner: "none",
      };

      const rests = challengers.toSpliced(i, 1);
      if (rests.length >= 2) {
        const restPair = makePairRecursive(rests, matches);
        if (restPair) {
          return [newPair, ...restPair];
        }
      } else {
        return [newPair];
      }
    }
  }
  return undefined;
};

export const getPairInMatch = (playerId: PlayerId, match: Match) => {
  for (const pair of match.pairList) {
    if (hasPlayerInPair(playerId, pair)) {
      return pair;
    }
  }
  return undefined;
};

export const makeAllMatches = (players: Player[], ghostPlayer: Player) => {
  const shuffledPlayers = shuffle(players);
  const evenPlayers = isEven(shuffledPlayers)
    ? shuffledPlayers
    : [ghostPlayer, ...shuffledPlayers];

  return roundRobin(evenPlayers.length).map((indexMatch) => {
    const pairList = indexMatch.map((indexPair) => {
      const pair: Pair = {
        left: evenPlayers[indexPair[0]].id,
        right: evenPlayers[indexPair[1]].id,
        winner: "none",
        id: makeId() as PairId,
      };
      return pair;
    });
    const match: Match = { pairList: pairList, id: makeId() as MatchId };
    return match;
  });
};

const getMinMax = (
  left: number,
  right: number
): { min: number; max: number } => {
  if (left < right) {
    return { min: left, max: right };
  } else {
    return { max: right, min: left };
  }
};

export const swissDraw2 = (
  players: Player[],
  pastMatches: Match[],
  restMatches: Match[]
): { newMatch: Match | undefined; restMatches: Match[] } => {
  if (restMatches.length <= 0) {
    return { newMatch: undefined, restMatches: [] };
  }

  if (restMatches.length === 1) {
    return { newMatch: restMatches[0], restMatches: [] };
  }

  const playerWinCountMap: Map<PlayerId, number> = new Map();
  for (const player of players) {
    playerWinCountMap.set(player.id, getPlayerWinCount(player.id, pastMatches));
  }

  // マッチ内のペアリストを勝数で並べ替え。
  const toSortedMatchWithWinCount = (match: Match): Match => {
    return {
      ...match,
      pairList: match.pairList.toSorted((a, b) => {
        const aLeft = playerWinCountMap.get(a.left);
        const aRight = playerWinCountMap.get(a.right);
        const bLeft = playerWinCountMap.get(b.left);
        const bRight = playerWinCountMap.get(b.right);

        if (
          aLeft !== undefined &&
          aRight !== undefined &&
          bLeft !== undefined &&
          bRight !== undefined
        ) {
          const { min: aMin, max: aMax } = getMinMax(aLeft, aRight);
          const { min: bMin, max: bMax } = getMinMax(bLeft, bRight);
          if (aMax !== bMax) {
            return bMax - aMax;
          }
          return bMin - aMin;
        }
        return 0;
      }),
    };
  };

  // 残りの組み合わせの中から、勝数の多い人同士が対戦相手になるような組み合わせを選ぶ。
  const sortedRestMatches = restMatches
    .map((match) => {
      return toSortedMatchWithWinCount(match);
    })
    .toSorted((a, b) => {
      const len = a.pairList.length;
      console.assert(len == b.pairList.length);
      for (let i = 0; i < len; ++i) {
        const aLeft = playerWinCountMap.get(a.pairList[i].left);
        const aRight = playerWinCountMap.get(a.pairList[i].right);
        const bLeft = playerWinCountMap.get(b.pairList[i].left);
        const bRight = playerWinCountMap.get(b.pairList[i].right);
        if (
          aLeft !== undefined &&
          aRight !== undefined &&
          bLeft !== undefined &&
          bRight !== undefined
        ) {
          const aDiff = Math.abs(aLeft - aRight);
          const bDiff = Math.abs(bLeft - bRight);
          if (aDiff !== bDiff) {
            return aDiff - bDiff;
          }
        }
      }
      return 0;
    });
  return {
    newMatch: sortedRestMatches[0],
    restMatches: sortedRestMatches.toSpliced(0, 1),
  };
};

export const printMatch = (
  match: Match,
  players: Player[],
  pastMatches: Match[]
) => {
  for (const pair of match.pairList) {
    const leftName = getPlayerName(pair.left, players);
    const rightName = getPlayerName(pair.right, players);
    const leftWinCount = getPlayerWinCount(pair.left, pastMatches);
    const rightWinCount = getPlayerWinCount(pair.right, pastMatches);
    console.log(
      `${leftName}(${leftWinCount}) vs ${rightName}(${rightWinCount})`
    );
  }
};

export const isUniqueMatch = (newMatch: Match, pastMatches: Match[]) => {
  for (const pastMatch of pastMatches) {
    for (const pastPair of pastMatch.pairList) {
      for (const newPair of newMatch.pairList) {
        if (existPair(newPair.left, newPair.right, pastPair)) {
          return false;
        }
      }
    }
  }
  return true;
};
