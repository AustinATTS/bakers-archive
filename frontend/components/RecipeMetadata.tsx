/**
 * Recipe metadata display component.
 */

'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import { RecipeMeta } from '@/lib/api';

interface RecipeMetadataProps {
  recipe: RecipeMeta;
}

export default function RecipeMetadata({ recipe }: RecipeMetadataProps): React.JSX.Element {
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{xs: 12, sm: 4}}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Author
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {recipe.author}
              </Typography>
            </Box>
          </Box>
        </Grid>
        {recipe.book && (
          <Grid size={{xs: 12, sm: 4}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBookIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Book / Source
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {recipe.book}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid size={{xs: 12, sm: 4}}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Type
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                {recipe.type}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {recipe.tags.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {recipe.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  bgcolor: 'secondary.light',
                  color: 'text.primary',
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {recipe.ingredients.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Ingredients
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 0.5,
            }}
          >
            {recipe.ingredients.map((ing, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  '&::before': {
                    content: '"•"',
                    color: 'primary.main',
                    fontWeight: 700,
                  },
                }}
              >
                {ing}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
