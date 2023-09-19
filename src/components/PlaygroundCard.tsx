"use client"
import RouterLink from 'next/link'
import * as React from 'react';
import ArticleIcon from '@mui/icons-material/Article';
import { Card, CardActionArea, CardHeader, Avatar } from '@mui/material';

const PlaygroundCard: React.FC = () => {

  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} prefetch={false} href="/playground">
        <CardHeader title="Playground" avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>} />
      </CardActionArea>
    </Card>
  );
}

export default PlaygroundCard;