"use client";
import { Box, Button, Container, Grid2, List, ListItem, ListSubheader, Stack, Tab, Tabs, TextField, ThemeProvider, ToggleButton, Typography, createTheme } from "@mui/material";

import IconButton from '@mui/material/IconButton';
import { useEffect, useRef, useState } from "react";
import localforage from "localforage";
import { isEven, makeId } from "@/lib/util";
import { getSide, getWinnerId } from "@/lib/pair";
import { indigo } from "@mui/material/colors";
import { getHelperTextForNameValidation, getPlayerName, isPlayer, isPlayers, isValidPlayerName } from "@/lib/player";
import { getPlayerWinCountUntilMatchId, isMatches, swissDraw } from "@/lib/match";
import { RankTable } from "@/components/rankTable";
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QRCode from "@/components/qrcode";

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none"
    }
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "outlined"
      }
    }
  },
  palette: {
    primary: indigo,
  }
});

const tabList = ["参加者", "対戦表", "順位表"];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      hidden={value !== index}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const Title = ({ children: children }: { children?: React.ReactNode }) => {
  return (
    <Typography variant="h5" sx={{ my: 1 }}>
      {children}
    </Typography>
  )
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [ghostPlayer, setGhostPlayer] = useState<Player>({ id: makeId() as PlayerId, name: "不在" });
  const [matches, setMatches] = useState<Match[]>([]);

  const [tab, setTab] = useState(0);

  const [requestAutoFocus, setRequestAutoFocus] = useState(false);

  const [requestScrollEnd, setRequestScrollEnd] = useState(true);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [requestScrollEnd]);

  const clearMatches = () => {
    setMatches([]);
  }

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      name: "",
      id: makeId() as PlayerId,
    };

    setPlayers((players) => [...players, newPlayer]);
    clearMatches();
    setRequestAutoFocus(true);
  };

  const handleChangePlayerName = (id: PlayerId, name: string) => {
    setPlayers((players) => {
      const newPlayers = players.map((player) => {
        if (player.id === id) {
          return { ...player, name: name };
        } else {
          return player;
        }
      });
      return newPlayers;
    });
  };

  const handleDeletePlayer = (index: number) => {
    // TODO: 削除前の確認メッセージを表示する or 削除対象のプレイヤーの試合だけ削除する．
    // 削除対象のプレイヤーの試合だけ削除すると，勝ち数と合わなくなってややこしくなりそうなので，全削除が無難だと思う．
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
    clearMatches();
  };

  const handleMakeMatch = () => {
    for (const match of matches) {
      for (const pair of match.pairList) {
        if (pair.winner === "none") {
          // TODO ダイアログにする。
          alert("前の試合が完了していません。");
          return;
        }
      }
    }

    let newMatch = swissDraw(players, matches, ghostPlayer);

    if (!newMatch) {
      alert("全ての対局が完了しました。");
      return;
    }

    // 対戦相手がいない場合は不戦勝とする.
    if (!isEven(players)) {
      newMatch = {
        ...newMatch,
        pairList: newMatch.pairList.map((pair) => {
          if (pair.left === ghostPlayer.id) {
            pair.winner = "right";
          } else if (pair.right === ghostPlayer.id) {
            pair.winner = "left";
          }
          return pair;
        })
      };
    }

    setMatches((matches) => [...matches, newMatch!]);
    setRequestScrollEnd((prev) => !prev)
  };

  const handleWin = (
    newWinnerId: PlayerId,
    matchId: MatchId,
    pairId: PairId,
  ) => {
    setMatches((prevMatches): Match[] => {
      return prevMatches.map((match) => {
        if (match.id === matchId) {
          return {
            ...match, pairList: match.pairList.map((pair) => {
              if (pair.id === pairId) {
                if (getWinnerId(pair) === newWinnerId) {
                  return { ...pair, winner: "none" };
                } else {
                  return { ...pair, winner: getSide(pair, newWinnerId) };
                }
              } else {
                return pair;
              }
            })
          };
        } else {
          return match;
        }
      })
    })
  }

  const handleChangeTab = (_: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
  };

  // ローカルストレージへの保存.
  const STORAGE_KEY_GHOST_PLAYER = "swiss-draw-ghost-player";
  const STORAGE_KEY_PLAYERS = "swiss-draw-players";
  const STORAGE_KEY_MATCHES = "swiss-draw-matches";

  useEffect(() => {
    localforage.getItem(STORAGE_KEY_GHOST_PLAYER).then((savedGhostPlayer) => { isPlayer(savedGhostPlayer) ? setGhostPlayer(savedGhostPlayer) : localforage.setItem(STORAGE_KEY_GHOST_PLAYER, ghostPlayer) });
    localforage.getItem(STORAGE_KEY_PLAYERS).then((players) => isPlayers(players) && setPlayers(players));
    localforage.getItem(STORAGE_KEY_MATCHES).then((matches) => isMatches(matches) && setMatches(matches));
  }, []);

  useEffect(() => {
    localforage.setItem(STORAGE_KEY_PLAYERS, players);
  }, [players]);

  useEffect(() => {
    localforage.setItem(STORAGE_KEY_MATCHES, matches);
  }, [matches]);

  const currentURL = window.location.href;

  return (
    <ThemeProvider theme={theme}>
      <Container>

        <Box sx={{ width: "100%" }}>
          <Stack spacing={1}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={handleChangeTab} centered>
                {
                  tabList.map((tabItem) => { return <Tab key={tabItem} label={tabItem} sx={{ flexGrow: 1 }} />; })
                }
              </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
              <Title>参加者</Title>
              <List disablePadding>
                {players.map((player, index) => {
                  return (
                    <ListItem key={player.id}>
                      <Stack spacing={1} direction="row" sx={{ width: "100%" }} alignItems="center">
                        <Typography>
                          {index + 1}
                        </Typography>
                        <TextField
                          value={player.name}
                          onChange={(e) => handleChangePlayerName(player.id, e.target.value)}
                          autoFocus={(index === (players.length - 1)) && requestAutoFocus}
                          placeholder="参加者名を入力"
                          helperText={getHelperTextForNameValidation(player.name, players)}
                          error={isValidPlayerName(player.name, players) !== "valid"}
                          fullWidth
                        />
                        <IconButton
                          aria-label="delete player"
                          onClick={() => handleDeletePlayer(index)}
                          color="error"
                        >
                          <HighlightOffIcon />
                        </IconButton>
                      </Stack>
                    </ListItem>
                  )
                })
                }
                <ListItem>
                  <Button
                    variant="outlined"
                    onClick={handleAddPlayer}
                    fullWidth
                    startIcon={<PersonAddIcon />}
                  >
                    <Typography>
                      参加者を追加
                    </Typography>
                  </Button>
                </ListItem>
              </List>

              <QRCode url={currentURL} size={256} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <Title>対戦表</Title>
              <List disablePadding subheader={<ListSubheader>勝者の名前をクリックします。もう一度クリックするとリセットされます。</ListSubheader>}>
                {matches.map((match, matchIndex) => {
                  return (
                    <ListItem key={match.id} sx={{ py: 1 }} disablePadding>
                      <Stack sx={{ width: "100%" }}>
                        <Typography>{`${matchIndex + 1}試合目`}</Typography>
                        <List disablePadding>
                          {match.pairList.map((pair) => {
                            const PlayerButton = ({ playerId: playerId }: { playerId: PlayerId }) => {
                              return (
                                <ToggleButton color="primary" fullWidth value={playerId} selected={getWinnerId(pair) === playerId} onChange={(_, newWinnerId) => handleWin(newWinnerId, match.id, pair.id)}>
                                  <Stack direction="column" alignItems="center">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      {
                                        (pair.winner === "none") ? <></> : (getWinnerId(pair) === playerId) ? <CircleOutlinedIcon /> : <CloseOutlinedIcon />
                                      }
                                      <Typography variant="h5" component="div">
                                        {`${getPlayerName(playerId, [...players, ghostPlayer])}`}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="subtitle1" component="div">
                                      勝数：{getPlayerWinCountUntilMatchId(playerId, match.id, matches)}
                                    </Typography>
                                  </Stack>
                                </ToggleButton>
                              )
                            };

                            return (
                              <ListItem key={pair.id} disablePadding>
                                <Box sx={{ width: "100%" }}>
                                  <Grid2 container spacing={2} alignItems="baseline">
                                    <Grid2 size="grow">
                                      <PlayerButton playerId={pair.left} />
                                    </Grid2>

                                    <Grid2 size="auto">
                                      <Typography>
                                        VS
                                      </Typography>
                                    </Grid2>

                                    <Grid2 size="grow">
                                      <PlayerButton playerId={pair.right} />
                                    </Grid2>
                                  </Grid2>
                                </Box>
                              </ListItem>
                            )
                          })}
                        </List>

                      </Stack>
                    </ListItem>
                  )
                })}
              </List>

              <Stack sx={{ width: "100%" }} spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleMakeMatch}
                >
                  組み合わせを決める
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => clearMatches()}
                >
                  対戦表を削除する
                </Button>
              </Stack>


              <div ref={scrollEndRef} />

            </TabPanel>
            <TabPanel value={tab} index={2}>
              <Title>順位表</Title>
              <RankTable players={players} matches={matches} />
            </TabPanel>
          </Stack>
        </Box>
      </Container >
    </ThemeProvider >
  );
}
