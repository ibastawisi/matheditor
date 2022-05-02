import CircularProgress from "@mui/material/CircularProgress";
import Logo from '../logo.png';

const SplashScreen: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className='splash-screen'>
      <div className='splash-screen-content'>
        <img src={Logo} alt="Logo" width={128} height={128} />
        {title && <h3>{title}</h3>}
        <CircularProgress />
      </div>
    </div>
  );
}
export default SplashScreen;