export type SuccessQueryResult = {
  success: true;
  objects: any[];
};

export type ErrorQueryResult = {
  success: false;
  message: string;
};
