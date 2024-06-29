import { CAN_USE_DOM } from '@lexical/utils';

export const IS_MOBILE: boolean =
  CAN_USE_DOM && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
