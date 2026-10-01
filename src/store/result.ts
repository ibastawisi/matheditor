import { enqueueSnackbar } from 'notistack';

export interface AppError { title: string, subtitle?: string }
export interface Result<T> { data?: T; error?: AppError }

// logs an unexpected error and reports it in the same shape as a failed API response
export const failure = (error: any): { error: AppError } => {
  console.error(error);
  return { error: { title: "Something went wrong", subtitle: error?.message } };
};

// shows a failure as an error toast before handing it back to the caller
export const announceFailure = (result: { error: AppError }) => {
  enqueueSnackbar(result.error.title, { variant: "error", description: result.error.subtitle });
  return result;
};
