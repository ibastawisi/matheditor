import { floatState, writingModeState } from "./states";

export type TableFloat = ReturnType<typeof floatState.parse>;
export type TableWritingMode = ReturnType<typeof writingModeState.parse>;
