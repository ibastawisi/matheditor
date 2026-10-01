"use client"
import { forwardRef } from 'react';
import { closeSnackbar, SnackbarContent, SnackbarProvider, type CustomContentProps } from 'notistack';
import { Alert, AlertTitle, Box, IconButton, SnackbarContent as MuiSnackbarContent, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';

declare module 'notistack' {
  interface VariantOverrides {
    default: { description?: string };
    success: { description?: string };
    error: { description?: string };
    warning: { description?: string };
    info: { description?: string };
  }
}

type ToastProps = CustomContentProps & { description?: string };

const Toast = forwardRef<HTMLDivElement, ToastProps>(({ id, message, description, action, variant, style, className }, ref) => {
  const close = () => closeSnackbar(id);
  const actions = <>
    {action && <Box sx={{ display: 'contents' }} onClick={close}>{typeof action === 'function' ? action(id) : action}</Box>}
    <IconButton size="small" aria-label="close" color="inherit" onClick={close}>
      <Close fontSize="small" />
    </IconButton>
  </>;

  return (
    <SnackbarContent ref={ref} style={style} className={className}>
      {variant === 'default' ?
        <MuiSnackbarContent
          sx={{ width: '100%' }}
          message={<>
            <Typography variant='subtitle2'>{message}</Typography>
            {description}
          </>}
          action={actions}
        /> :
        <Alert variant="filled" severity={variant} action={actions} sx={{ width: '100%' }}>
          <AlertTitle sx={{ mb: description ? undefined : 0 }}>{message}</AlertTitle>
          {description}
        </Alert>
      }
    </SnackbarContent>
  );
});

Toast.displayName = 'Toast';

const Toaster = () => <SnackbarProvider Components={{ default: Toast, success: Toast, error: Toast, warning: Toast, info: Toast }} />;

export default Toaster;
