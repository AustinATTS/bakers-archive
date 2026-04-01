/**
 * Recipe list sidebar component.
 */

'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { RecipeMeta } from '@/lib/api';
import RecipeCard from './RecipeCard';

interface RecipeListProps {
  recipes: RecipeMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function RecipeList({
  recipes,
  selectedId,
  onSelect,
}: RecipeListProps): React.JSX.Element {
  if (recipes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No recipes found.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your search.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5 }}>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          selected={recipe.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
}
