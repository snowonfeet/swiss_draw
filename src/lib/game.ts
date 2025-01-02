export const isGameName = (arg: unknown): arg is GameName => {
  const record = arg as Record<keyof GameName, unknown>;
  return (
    record && typeof record.id === "string" && typeof record.name === "string"
  );
};

export const isGameNames = (arg: unknown): arg is GameName[] => {
  return Array.isArray(arg) && arg.every(isGameName);
};
