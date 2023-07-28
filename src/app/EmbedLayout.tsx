"use client";
import Container from "@mui/material/Container";

const EmbedLayout = ({ children }: { children: React.ReactNode; }) => {
  return <Container className='editor-container'>
    {children}
  </Container>;
};

export default EmbedLayout;