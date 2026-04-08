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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

import { useAuth } from '@/lib/AuthContext';
import {
  UserPublic,
  AdminStats,
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
      loadStats();
    }
  }, [user, loadUsers, loadStats]);

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
              <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : statsError ? (
                <Alert severity="error">{statsError}</Alert>
              ) : stats ? (
                <Grid container spacing={3}>
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