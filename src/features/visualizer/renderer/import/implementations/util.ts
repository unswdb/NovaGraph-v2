import type { GraphDatabase } from "~/features/visualizer/types";

export const validateNames = async (value: string, databases?: GraphDatabase[]) => {
  const doesNameExist = databases
    ?.map((database) => database.label)
    .includes(value);

  if (doesNameExist) {
    return {
      success: false,
      message: "A database with this name already exists",
    };
  }

  return { success: true };
};