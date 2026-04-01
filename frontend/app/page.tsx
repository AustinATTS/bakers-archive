/**
 * Main page component for The Baker's Archive.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { RecipeMeta, listRecipes, searchRecipes, SearchParams } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import RecipeList from '@/components/RecipeList';
import RecipeView from '@/components/RecipeView';

const DRAWER_WIDTH = 340;

export default function HomePage(): React.JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [recipes, setRecipes] = useState<RecipeMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const loadRecipes = useCallback(async (params?: SearchParams): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = params && Object.keys(params).some((k) => params[k as keyof SearchParams])
        ? await searchRecipes(params)
        : await listRecipes();
      setRecipes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleSearch = useCallback(
    (query: string): void => {
      setSearchQuery(query);
      if (query.trim()) {
        loadRecipes({ query: query });
      } else {
        loadRecipes();
      }
    },
    [loadRecipes],
  );

  const handleSelectRecipe = useCallback((id: string): void => {
    setSelectedId(id);
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <SearchBar value={searchQuery} onSearch={handleSearch} />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <RecipeList
            recipes={recipes}
            selectedId={selectedId}
            onSelect={handleSelectRecipe}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          borderBottom: '3px solid',
          borderColor: 'secondary.main',
        }}
      >
        <Toolbar>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'white',
            }}
          >
            🍞 The Baker's Archive
          </Typography>
          <Typography
            variant="body2"
            sx={{ ml: 2, color: 'rgba(255,255,255,0.75)', display: { xs: 'none', sm: 'block' } }}
          >
            🥖 Your artisan bread library 🥐
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, mt: '64px', overflow: 'hidden' }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
            }}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                top: '64px',
                height: 'calc(100% - 64px)',
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 2, md: 3 },
            ml: isMobile ? 0 : 0,
          }}
        >
          {selectedId ? (
            <RecipeView recipeId={selectedId} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                color: 'text.secondary',
              }}
            >
              <Typography variant="h2" sx={{ fontSize: '5rem' }}>
                🍞
              </Typography>
              <Typography variant="h4" color="text.secondary">
                Select a recipe to get started
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose a bread recipe from the list on the left
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
