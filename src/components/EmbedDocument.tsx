import "mathlive/static.css"
import '@/editor/theme.css';
import { Container } from "@mui/material";

const EmbedDocument: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Container className='editor-container'>
      {children}
    </Container>
  );
}

export default EmbedDocument;