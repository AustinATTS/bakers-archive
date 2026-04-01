/**
 * Recipe card component for the sidebar list.
 */

'use client';

import React, { useCallback } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { RecipeMeta } from '@/lib/api';

const typeEmoji: Record<string, string> = {
  sourdough: '🍞',
  enriched: '🍞',
  flatbread: '🍞',
  lean: '🍞',
  rye: '🍞',
};

interface RecipeCardProps {
  recipe: RecipeMeta;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function RecipeCard({
  recipe,
  selected,
  onSelect,
}: RecipeCardProps): React.JSX.Element {
  const handleClick = useCallback((): void => {
    onSelect(recipe.id);
  }, [recipe.id, onSelect]);

  const emoji = typeEmoji[recipe.type] ?? '🍞';

  return (
    <Card
      sx={{
        mb: 1.5,
        border: 2,
        borderColor: selected ? 'primary.main' : 'transparent',
        bgcolor: selected ? 'rgba(139,94,60,0.08)' : 'background.paper',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'secondary.main',
          boxShadow: '0 4px 12px rgba(139,94,60,0.15)',
        },
      }}
    >
      <CardActionArea onClick={handleClick}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.8rem', lineHeight: 1, mt: 0.25 }}>{emoji}</Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color="text.primary"
                noWrap
                sx={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif' }}
              >
                {recipe.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {recipe.author} {recipe.book ? `• ${recipe.book}` : ''}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                <Chip
                  label={recipe.type}
                  size="small"
                  sx={{
                    bgcolor: 'secondary.light',
                    color: 'text.primary',
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
                {recipe.tags.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'primary.light',
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                      height: 20,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
