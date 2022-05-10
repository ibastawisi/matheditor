import Box from '@mui/material/Box';
import CircularProgress from "@mui/material/CircularProgress";
import Logo from '../logo.png';

const SplashScreen: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className='splash-screen'>
      <div className='splash-screen-content'>
        <img src={Logo} alt="Logo" width={128} height={128} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={24} sx={{ mx: 1 }} />
          {title && <h3>{title}</h3>}
        </Box>

      </div>
    </div>
  );
}
export default SplashScreen;