/**
 * Main page component for The Baker's Archive.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { RecipeMeta, listRecipes, searchRecipes, SearchParams } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import SearchBar from '@/components/SearchBar';
import RecipeList from '@/components/RecipeList';
import RecipeView from '@/components/RecipeView';
import LoginDialog from '@/components/LoginDialog';
import CreateRecipeDialog from '@/components/CreateRecipeDialog';

const DRAWER_WIDTH = 340;

export default function HomePage(): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const [mobileNavValue, setMobileNavValue] = useState<number>(0);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const [recipes, setRecipes] = useState<RecipeMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const handleRecipeCreated = useCallback((recipe: RecipeMeta): void => {
    setRecipes((prev) => [recipe, ...prev]);
    setSelectedId(recipe.id);
    setCreateOpen(false);
  }, []);

  // Bottom navigation handler
  const handleMobileNavChange = useCallback((_: React.SyntheticEvent, value: number): void => {
    setMobileNavValue(value);
    if (value === 0) {
      setMobileOpen(true);
    } else if (value === 1) {
      setMobileOpen(true);
      setMobileSearchOpen(true);
    } else if (value === 2 && user) {
      setCreateOpen(true);
    }
  }, [user]);

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
            isSearching={!!searchQuery.trim()}
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
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' }, color: 'rgba(255,255,255,0.9)', minWidth: 44, minHeight: 44 }}
            aria-label="Open recipe list"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            component="div"
            sx={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            🍞 The Baker's Archive
          </Typography>
          <Typography
            variant="body2"
            sx={{ ml: 1, color: 'rgba(255,255,255,0.75)', display: { xs: 'none', lg: 'block' }, whiteSpace: 'nowrap' }}
          >
            🥖 Your artisan bread library 🥐
          </Typography>
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

          {user ? (
            <>
              <Tooltip title={`Signed in as ${user.username}`}>
                <Button
                  color="inherit"
                  startIcon={<AccountCircleIcon />}
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'none', minHeight: 44 }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{user.username}</Box>
                </Button>
              </Tooltip>
              <Menu
                anchorEl={userMenuAnchor}
                open={!!userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
              >
                {user.is_admin && (
                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      router.push('/admin');
                    }}
                  >
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
                    Admin Dashboard
                  </MenuItem>
                )}
                {user.is_admin && <Divider />}
                <MenuItem
                  onClick={() => {
                    setUserMenuAnchor(null);
                    logout();
                  }}
                >
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={() => setLoginOpen(true)}
              sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'none', minHeight: 44 }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign In</Box>
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      <CreateRecipeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleRecipeCreated}
      />

      <Box sx={{ display: 'flex', flex: 1, mt: '64px', overflow: 'hidden', pb: isMobile ? '56px' : 0 }}>
        {isMobile ? (
          <SwipeableDrawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onOpen={() => setMobileOpen(true)}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
            }}
          >
            {sidebarContent}
          </SwipeableDrawer>
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
            p: { xs: 1.5, md: 3 },
          }}
        >
          {selectedId ? (
            <RecipeView
              recipeId={selectedId}
              onOpenSidebar={isMobile ? () => setMobileOpen(true) : undefined}
            />
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
              <Typography variant="h2" sx={{ fontSize: { xs: '3rem', md: '5rem' } }}>
                🍞
              </Typography>
              <Typography variant="h4" color="text.secondary" textAlign="center" sx={{ fontSize: { xs: '1.4rem', md: '2.125rem' } }}>
                Select a recipe to get started
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                {isMobile ? 'Tap the ☰ menu to browse recipes' : 'Choose a bread recipe from the list on the left'}
              </Typography>
              {user && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Create a new recipe
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {user && !isMobile && (
        <Fab
          color="primary"
          aria-label="New recipe"
          onClick={() => setCreateOpen(true)}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      {isMobile && (
        <BottomNavigation
          value={mobileNavValue}
          onChange={handleMobileNavChange}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            height: 56,
          }}
        >
          <BottomNavigationAction label="Browse" icon={<MenuBookIcon />} />
          <BottomNavigationAction label="Search" icon={<SearchIcon />} />
          {user && <BottomNavigationAction label="New" icon={<AddIcon />} />}
        </BottomNavigation>
      )}
    </Box>
  );
}