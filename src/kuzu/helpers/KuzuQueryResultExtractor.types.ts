export type SuccessQueryResult = {
  success: true;
  objects: Record<string, any>[];
};

export type ErrorQueryResult = {
  success: false;
  message: string;
};
