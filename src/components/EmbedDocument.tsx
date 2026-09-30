import { Container } from "@mui/material";

const EmbedDocument: React.FC<{ html: string }> = ({ html }) => {
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
      <div className="document-container" dangerouslySetInnerHTML={{ __html: html }} />
    </Container>
  );
}

export default EmbedDocument;