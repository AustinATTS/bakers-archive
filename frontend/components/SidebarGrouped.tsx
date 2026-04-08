/**
 * Grouped sidebar list component with accordion sections.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RecipeMeta } from '@/lib/api';
import RecipeCard from './RecipeCard';

type GroupMode = 'all' | 'type' | 'book';

const GROUP_MODE_KEY = 'brms_group_mode';

const CURATED_COLLECTIONS: { label: string; tags: string[] }[] = [
  { label: '🌟 Sourdough Favourites', tags: ['sourdough', 'artisan'] },
  { label: '⚡ Quick Breads', tags: ['quick', 'easy', 'fast'] },
  { label: '🎉 Weekend Bakes', tags: ['weekend', 'long-ferment', 'overnight'] },
];

interface SidebarGroupedProps {
  recipes: RecipeMeta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isSearching: boolean;
}

export default function SidebarGrouped({
  recipes,
  selectedId,
  onSelect,
  isSearching,
}: SidebarGroupedProps): React.JSX.Element {
  const [groupMode, setGroupMode] = useState<GroupMode>('type');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GROUP_MODE_KEY) as GroupMode | null;
      if (saved && ['all', 'type', 'book'].includes(saved)) {
        setGroupMode(saved);
      }
    } catch {
    }
  }, []);

  const handleGroupModeChange = (_: React.MouseEvent, value: GroupMode | null): void => {
    if (!value) return;
    setGroupMode(value);
    try {
      localStorage.setItem(GROUP_MODE_KEY, value);
    } catch {
    }
  };

  const groups = useMemo<{ label: string; items: RecipeMeta[] }[]>(() => {
    if (isSearching || groupMode === 'all') {
      return [{ label: 'All Recipes', items: recipes }];
    }
    if (groupMode === 'type') {
      const map = new Map<string, RecipeMeta[]>();
      for (const r of recipes) {
        const key = r.type || 'other';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({
          label: `${label.charAt(0).toUpperCase()}${label.slice(1)} (${items.length})`,
          items,
        }));
    }
    if (groupMode === 'book') {
      const map = new Map<string, RecipeMeta[]>();
      for (const r of recipes) {
        const key = r.book || 'No Book';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({
          label: `${label} (${items.length})`,
          items,
        }));
    }
    return [{ label: 'All Recipes', items: recipes }];
  }, [recipes, groupMode, isSearching]);

  const curatedGroups = useMemo<{ label: string; items: RecipeMeta[] }[]>(() => {
    if (isSearching || groupMode !== 'type') return [];
    return CURATED_COLLECTIONS.map(({ label, tags }) => ({
      label,
      items: recipes.filter((r) =>
        tags.some((t) => r.tags.map((rt) => rt.toLowerCase()).includes(t.toLowerCase())),
      ),
    })).filter((g) => g.items.length > 0);
  }, [recipes, groupMode, isSearching]);

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

  const showFlat = isSearching || groupMode === 'all';

  return (
    <Box>
      {!isSearching && (
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
          <ToggleButtonGroup
            value={groupMode}
            exclusive
            onChange={handleGroupModeChange}
            size="small"
            fullWidth
            sx={{ '& .MuiToggleButton-root': { fontSize: '0.7rem', py: 0.5 } }}
          >
            <ToggleButton value="type">By Type</ToggleButton>
            <ToggleButton value="book">By Book</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {isSearching && (
        <Box sx={{ px: 1.5, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {recipes.length} result{recipes.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {showFlat ? (
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
      ) : (
        <Box>
          {groups.map((group) => (
            <Accordion
              key={group.label}
              defaultExpanded={group.items.some((r) => r.id === selectedId) || groups.length === 1}
              disableGutters
              elevation={0}
              sx={{
                border: 0,
                '&::before': { display: 'none' },
                bgcolor: 'transparent',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  minHeight: 40,
                  px: 1.5,
                  '& .MuiAccordionSummary-content': { my: 0.5 },
                  bgcolor: 'rgba(139,94,60,0.06)',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {group.label}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, pt: 1 }}>
                {group.items.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    selected={recipe.id === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          ))}

          {curatedGroups.length > 0 && (
            <>
              <Box sx={{ px: 1.5, pt: 2, pb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Curated Collections
                </Typography>
              </Box>
              {curatedGroups.map((group) => (
                <Accordion
                  key={group.label}
                  defaultExpanded={false}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: 0,
                    '&::before': { display: 'none' },
                    bgcolor: 'transparent',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{
                      minHeight: 40,
                      px: 1.5,
                      '& .MuiAccordionSummary-content': { my: 0.5 },
                      bgcolor: 'rgba(212,163,115,0.12)',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="secondary.dark">
                      {group.label} ({group.items.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1.5, pt: 1 }}>
                    {group.items.map((recipe) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        selected={recipe.id === selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}