import { Container } from "@mui/material";

const EmbedDocument: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Container
      className='editor-container'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        my: 2,
        flex: 1,
        position: 'relative'
      }}>
      <div className="document-container">{children}</div>
    </Container>
  );
}

export default EmbedDocument;