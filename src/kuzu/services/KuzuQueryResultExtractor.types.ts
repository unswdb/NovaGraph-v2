export type SuccessQueryResult = {
  success: true;
  objects: any[];
  rows: any[];
};

export type ErrorQueryResult = {
  success: false;
  message: string;
  rows: any[];
};
