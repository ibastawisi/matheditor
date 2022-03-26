import CircularProgress from "@mui/material/CircularProgress";
import Logo from '../logo.png';

const SplashScreen = () => {
  return (
    <div className='splash-screen'>
      <div className='splash-screen-content'>
      <img src={Logo} alt="Logo" width={128} height={128} />
        <CircularProgress />
      </div>
    </div>
  );
}
export default SplashScreen;