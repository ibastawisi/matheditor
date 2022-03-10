import Box from "@mui/material/Box"
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {Link as RouterLink} from 'react-router-dom';

const Documents: React.FC = () => {
  return(
    <Box>
    <Typography id="load-modal-title" variant="h6" component="h2">
      Load from Local Storage
    </Typography>
    {Object.keys({ ...localStorage }).map((key) => (
      key !== "document" && <Button sx={{ p: 2, m: 1, border: '1px dashed grey' }} key={key} component={RouterLink} to={`/edit/${key}`}>{key}</Button>
    ))}
  </Box>
  )
}

export default Documents;