import Box from '@mui/material/Box';
import CircularProgress from "@mui/material/CircularProgress";
import Typography from '@mui/material/Typography';

const SplashScreen: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className='splash-screen'>
      <div className='splash-screen-content'>
        <img src="/logo192.png" alt="Logo" />
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={36} disableShrink />
          <Typography variant='overline' component='h3'>{title}</Typography>
        </Box>

      </div>
    </div>
  );
}
export default SplashScreen;