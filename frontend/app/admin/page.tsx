/**
 * Admin dashboard page.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useAuth } from '@/lib/AuthContext';
import {
  RecipeMeta,
  RecipeUpdatePayload,
  UserPublic,
  AdminStats,
  listRecipes,
  deleteRecipe,
  updateRecipeMeta,
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminGetStats,
} from '@/lib/api';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }): React.JSX.Element {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const NEON_FREE_TIER_BYTES = 512 * 1024 * 1024;

export default function AdminPage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<number>(0);
  const [snack, setSnack] = useState<string>('');

  const [users, setUsers] = useState<UserPublic[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [usersError, setUsersError] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newIsAdmin, setNewIsAdmin] = useState<boolean>(false);
  const [createSaving, setCreateSaving] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  const [recipes, setRecipes] = useState<RecipeMeta[]>([]);
  const [recipesLoading, setRecipesLoading] = useState<boolean>(true);
  const [recipesError, setRecipesError] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editRecipe, setEditRecipe] = useState<RecipeMeta | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAuthor, setEditAuthor] = useState<string>('');
  const [editBook, setEditBook] = useState<string>('');
  const [editType, setEditType] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editIngredients, setEditIngredients] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const loadUsers = useCallback(async (): Promise<void> => {
    setUsersLoading(true);
    setUsersError('');
    try {
      setUsers(await adminListUsers());
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadRecipes = useCallback(async (): Promise<void> => {
    setRecipesLoading(true);
    setRecipesError('');
    try {
      setRecipes(await listRecipes());
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const loadStats = useCallback(async (): Promise<void> => {
    setStatsLoading(true);
    setStatsError('');
    try {
      setStats(await adminGetStats());
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      loadUsers();
      loadRecipes();
      loadStats();
    }
  }, [user, loadUsers, loadRecipes, loadStats]);

  const handleCreateUser = useCallback(async (): Promise<void> => {
    setCreateSaving(true);
    setCreateError('');
    try {
      const created = await adminCreateUser(newUsername.trim(), newPassword, newIsAdmin);
      setUsers((prev) => [...prev, created]);
      setCreateDialogOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setSnack(`User '${created.username}' created.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateSaving(false);
    }
  }, [newUsername, newPassword, newIsAdmin]);

  const handleDeleteUser = useCallback(async (username: string): Promise<void> => {
    try {
      await adminDeleteUser(username);
      setUsers((prev) => prev.filter((u) => u.username !== username));
      setSnack(`User '${username}' deleted.`);
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }, []);

  const handleDeleteRecipe = useCallback(async (recipeId: string): Promise<void> => {
    try {
      await deleteRecipe(recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setSnack('Recipe deleted.');
      setDeleteConfirmId(null);
      loadStats();
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Failed to delete recipe');
    }
  }, [loadStats]);

  const openEditDialog = useCallback((recipe: RecipeMeta): void => {
    setEditRecipe(recipe);
    setEditName(recipe.name);
    setEditAuthor(recipe.author);
    setEditBook(recipe.book);
    setEditType(recipe.type);
    setEditTags(recipe.tags.join(', '));
    setEditIngredients(recipe.ingredients.join('\n'));
    setEditError('');
    setEditDialogOpen(true);
  }, []);

  const handleEditSave = useCallback(async (): Promise<void> => {
    if (!editRecipe) return;
    setEditSaving(true);
    setEditError('');
    try {
      const payload: RecipeUpdatePayload = {
        name: editName.trim(),
        author: editAuthor.trim(),
        book: editBook.trim(),
        type: editType.trim(),
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        ingredients: editIngredients.split('\n').map((i) => i.trim()).filter(Boolean),
      };
      const updated = await updateRecipeMeta(editRecipe.id, payload);
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditDialogOpen(false);
      setEditRecipe(null);
      setSnack(`Recipe '${updated.name}' updated.`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update recipe');
    } finally {
      setEditSaving(false);
    }
  }, [editRecipe, editName, editAuthor, editBook, editType, editTags, editIngredients]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_admin) {
    return <></>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: 'primary.main', borderBottom: '3px solid', borderColor: 'secondary.main' }}
      >
        <Toolbar>
          <IconButton color="inherit" onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontWeight: 700, color: 'white' }}
          >
            🔧 Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: '64px', flex: 1, p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs value={tab} onChange={(_, v: number) => setTab(v)} textColor="primary" indicatorColor="primary">
              <Tab label="👥 Users" />
              <Tab label="🍞 Recipes" />
              <Tab label="📊 Statistics" />
            </Tabs>
          </Box>

          <TabPanel value={tab} index={0}>
            <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Users</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  New User
                </Button>
              </Box>

              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : usersError ? (
                <Alert severity="error">{usersError}</Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(139,94,60,0.06)' }}>
                        <TableCell><strong>Username</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.username} hover>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>
                            <Chip
                              label={u.is_admin ? 'Admin' : 'User'}
                              size="small"
                              color={u.is_admin ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              sx={{ color: 'error.main' }}
                              onClick={() => handleDeleteUser(u.username)}
                              disabled={u.username === user.username}
                              title={u.username === user.username ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recipes ({recipes.length})</Typography>
              </Box>

              {recipesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recipesError ? (
                <Alert severity="error">{recipesError}</Alert>
              ) : recipes.length === 0 ? (
                <Alert severity="info">No recipes found.</Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(139,94,60,0.06)' }}>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Author</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Tags</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recipes.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {r.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {r.id}
                            </Typography>
                          </TableCell>
                          <TableCell>{r.author}</TableCell>
                          <TableCell>
                            <Chip label={r.type} size="small" sx={{ textTransform: 'capitalize' }} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {r.tags.slice(0, 3).map((tag) => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                              ))}
                              {r.tags.length > 3 && (
                                <Chip label={`+${r.tags.length - 3}`} size="small" variant="outlined" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Edit metadata">
                              <IconButton size="small" color="primary" onClick={() => openEditDialog(r)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete recipe">
                              <IconButton
                                size="small"
                                sx={{ color: 'error.main' }}
                                onClick={() => {
                                  setDeleteConfirmId(r.id);
                                  setDeleteConfirmName(r.name);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : statsError ? (
                <Alert severity="error">{statsError}</Alert>
              ) : stats ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Content Overview
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{xs: 12, sm: 4}}>
                      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <CardContent>
                          <MenuBookIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h3" color="primary.main" fontWeight={700}>
                            {stats.total_recipes}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Recipes
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{xs: 12, sm: 4}}>
                      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <CardContent>
                          <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h3" color="primary.main" fontWeight={700}>
                            {stats.total_users}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Users
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{xs: 12, sm: 4}}>
                      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', textAlign: 'center' }}>
                        <CardContent>
                          <PhotoLibraryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h3" color="primary.main" fontWeight={700}>
                            {stats.total_media}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Media Files
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Storage
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{xs: 12, sm: 6}}>
                      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {stats.db_type === 'postgresql' ? 'Neon PostgreSQL' : 'SQLite'} Database
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stats.db_type === 'postgresql' ? 'Persistent cloud database' : 'Local file database'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="h4" color="primary.main" fontWeight={700} sx={{ mb: 0.5 }}>
                            {formatBytes(stats.db_size_bytes)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Database size ({stats.total_recipes} recipes, {stats.total_users} users, {stats.total_media} media records)
                          </Typography>
                          {stats.db_type === 'postgresql' && (
                            <Box sx={{ mt: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Usage</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatBytes(stats.db_size_bytes)} / {formatBytes(NEON_FREE_TIER_BYTES)} (free tier)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((stats.db_size_bytes / NEON_FREE_TIER_BYTES) * 100, 100)}
                                sx={{ borderRadius: 1, height: 6 }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <CloudIcon sx={{ fontSize: 32, color: stats.blob_enabled ? 'success.main' : 'text.disabled' }} />
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Vercel Blob Storage
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stats.blob_enabled ? 'Active — CDN-backed media storage' : 'Not configured — using local storage'}
                              </Typography>
                            </Box>
                          </Box>
                          {stats.blob_enabled ? (
                            <>
                              <Typography variant="h4" color="success.main" fontWeight={700} sx={{ mb: 0.5 }}>
                                {formatBytes(stats.blob_storage_used_bytes)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {stats.blob_item_count} file{stats.blob_item_count !== 1 ? 's' : ''} stored in Vercel Blob
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">Storage Usage</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatBytes(stats.blob_storage_used_bytes)} / {formatBytes(stats.blob_storage_limit_bytes)}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(stats.blob_storage_usage_percent, 100)}
                                  color={stats.blob_storage_usage_percent > 80 ? 'warning' : 'success'}
                                  sx={{ borderRadius: 1, height: 6 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                  {stats.blob_storage_usage_percent.toFixed(1)}% used
                                </Typography>
                              </Box>
                            </>
                          ) : (
                            <>
                              <Typography variant="h4" color="text.disabled" fontWeight={700} sx={{ mb: 0.5 }}>
                                —
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Set BLOB_READ_WRITE_TOKEN to enable Vercel Blob storage
                              </Typography>
                            </>
                          )}
                          {!stats.blob_enabled && stats.media_storage_used_bytes > 0 && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                              <Typography variant="caption" color="text.secondary">
                                Local media storage: {formatBytes(stats.media_storage_used_bytes)}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Vercel Deployment
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.vercel_deployment ? (
                      <>
                        <Grid size={{xs: 12}}>
                          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    Current Deployment
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Running on Vercel Serverless Functions
                                  </Typography>
                                </Box>
                                <Chip
                                  label={stats.vercel_deployment.environment || 'unknown'}
                                  size="small"
                                  color={stats.vercel_deployment.environment === 'production' ? 'success' : 'warning'}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </Box>

                              <TableContainer sx={{ mb: 2 }}>
                                <Table size="small">
                                  <TableBody>
                                    {stats.vercel_deployment.url && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 160, border: 0, py: 0.75 }}>URL</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>
                                          <a
                                            href={stats.vercel_deployment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit' }}
                                          >
                                            {stats.vercel_deployment.url}
                                          </a>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                    {stats.vercel_deployment.region && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, border: 0, py: 0.75 }}>Region</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>{stats.vercel_deployment.region}</TableCell>
                                      </TableRow>
                                    )}
                                    {stats.vercel_deployment.git_commit_sha && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, border: 0, py: 0.75 }}>Commit</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>
                                          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {stats.vercel_deployment.git_commit_sha.slice(0, 7)}
                                          </Box>
                                          {stats.vercel_deployment.git_commit_message && (
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                              {stats.vercel_deployment.git_commit_message.length > 80
                                                ? stats.vercel_deployment.git_commit_message.slice(0, 80) + '…'
                                                : stats.vercel_deployment.git_commit_message}
                                            </Typography>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )}
                                    {stats.vercel_deployment.git_commit_author && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, border: 0, py: 0.75 }}>Author</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>{stats.vercel_deployment.git_commit_author}</TableCell>
                                      </TableRow>
                                    )}
                                    {stats.vercel_deployment.git_commit_ref && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, border: 0, py: 0.75 }}>Branch</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>
                                          <Chip label={stats.vercel_deployment.git_commit_ref} size="small" variant="outlined" />
                                        </TableCell>
                                      </TableRow>
                                    )}
                                    {stats.vercel_deployment.git_repo && (
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 600, border: 0, py: 0.75 }}>Repository</TableCell>
                                        <TableCell sx={{ border: 0, py: 0.75 }}>{stats.vercel_deployment.git_repo}</TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>

                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {stats.vercel_api_url && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNewIcon />}
                                    href={stats.vercel_api_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    API Dashboard
                                  </Button>
                                )}
                                {stats.vercel_frontend_url && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNewIcon />}
                                    href={stats.vercel_frontend_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Frontend Dashboard
                                  </Button>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    ) : (
                      <Grid size={{xs: 12}}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <AnalyticsIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  Local Development
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Not running on Vercel — deployment info unavailable
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Deploy to Vercel to see deployment statistics such as commit info, region, environment, and more.
                              {!stats.vercel_api_url && !stats.vercel_frontend_url && (
                                <> Set <code>VERCEL_API_PROJECT_URL</code> and <code>VERCEL_FRONTEND_PROJECT_URL</code> to add quick links to the Vercel project dashboards.</>
                              )}
                              {stats.vercel_api_url && !stats.vercel_frontend_url && (
                                <> Set <code>VERCEL_FRONTEND_PROJECT_URL</code> to add a quick link to the frontend Vercel dashboard.</>
                              )}
                              {!stats.vercel_api_url && stats.vercel_frontend_url && (
                                <> Set <code>VERCEL_API_PROJECT_URL</code> to add a quick link to the API Vercel dashboard.</>
                              )}
                            </Typography>
                            {(stats.vercel_api_url || stats.vercel_frontend_url) && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                {stats.vercel_api_url && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNewIcon />}
                                    href={stats.vercel_api_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    API Dashboard
                                  </Button>
                                )}
                                {stats.vercel_frontend_url && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNewIcon />}
                                    href={stats.vercel_frontend_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Frontend Dashboard
                                  </Button>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </>
              ) : null}
            </Box>
          </TabPanel>
        </Paper>
      </Box>

      <Dialog open={createDialogOpen} onClose={() => !createSaving && setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={createSaving}
            />
            <TextField
              label="Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              disabled={createSaving}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  disabled={createSaving}
                />
              }
              label="Admin privileges"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={createSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createSaving || !newUsername.trim() || !newPassword}
              startIcon={createSaving ? <CircularProgress size={16} /> : undefined}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirmName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDeleteRecipe(deleteConfirmId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => !editSaving && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}>
          <DialogTitle>Edit Recipe Metadata</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            {editError && <Alert severity="error">{editError}</Alert>}
            <TextField
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              fullWidth
              disabled={editSaving}
            />
            <TextField
              label="Author"
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value)}
              required
              fullWidth
              disabled={editSaving}
            />
            <TextField
              label="Book / Source"
              value={editBook}
              onChange={(e) => setEditBook(e.target.value)}
              fullWidth
              disabled={editSaving}
            />
            <TextField
              label="Type"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              required
              fullWidth
              disabled={editSaving}
              helperText="e.g., sourdough, enriched, flatbread"
            />
            <TextField
              label="Tags"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              fullWidth
              disabled={editSaving}
              helperText="Comma-separated (e.g., artisan, whole wheat, beginner)"
            />
            <TextField
              label="Ingredients"
              value={editIngredients}
              onChange={(e) => setEditIngredients(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              maxRows={8}
              disabled={editSaving}
              helperText="One ingredient per line"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editSaving || !editName.trim() || !editAuthor.trim() || !editType.trim()}
              startIcon={editSaving ? <CircularProgress size={16} /> : undefined}
            >
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}