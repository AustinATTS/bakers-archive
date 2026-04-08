/**
 * Recipe list sidebar component.
 */

'use client';

import React from 'react';
import { RecipeMeta } from '@/lib/api';
import SidebarGrouped from './SidebarGrouped';

interface RecipeListProps {
  recipes: RecipeMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isSearching?: boolean;
}

export default function RecipeList({
  recipes,
  selectedId,
  onSelect,
  isSearching = false,
}: RecipeListProps): React.JSX.Element {
  return (
    <SidebarGrouped
      recipes={recipes}
      selectedId={selectedId}
      onSelect={onSelect}
      isSearching={isSearching}
    />
  );
}