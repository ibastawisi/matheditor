import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const PlaygroundCard: React.FC = () => {

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>
        }
        action={<Button startIcon={<OpenInNewIcon />} component={RouterLink} to="/playground">Open</Button>}
        title="Playground"
      />
    </Card>
  );
}

export default PlaygroundCard;