import { Container } from "@mui/material";
import StaticPages from "@/editor/extensions/pages/static";

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
      <StaticPages html={html} />
    </Container>
  );
}

export default EmbedDocument;