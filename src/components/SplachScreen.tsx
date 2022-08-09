import Box from '@mui/material/Box';
import CircularProgress from "@mui/material/CircularProgress";
import Typography from '@mui/material/Typography';
import Logo from '../logo.png';

const SplashScreen: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className='splash-screen'>
      <div className='splash-screen-content'>
        <img src={Logo} alt="Logo" width={128} height={128} />
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={36} disableShrink />
          <Typography variant='overline' component='h3'>{title}</Typography>
        </Box>

      </div>
    </div>
  );
}
export default SplashScreen;