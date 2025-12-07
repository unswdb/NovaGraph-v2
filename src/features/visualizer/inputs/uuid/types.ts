import type { UUID } from "crypto";

import type { BaseInputType } from "../types";

export type UUIDValues = UUID;

export type UUIDInput = BaseInputType<UUIDValues> & {
  type: "uuid";
};

export type ValueForUUID<I> = I extends UUIDInput ? UUIDValues : never;

export type PropsForUUID<I> = I extends UUIDInput
  ? Partial<UUIDInput> & BaseInputType<UUIDValues>
  : never;
