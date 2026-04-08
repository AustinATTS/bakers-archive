/**
 * Recipe view component with tabbed interface.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

import {
  RecipeMeta,
  MediaItem,
  getRecipe,
  getRecipeText,
  getRecipeNotes,
  updateRecipeText,
  updateRecipeNotes,
  listMedia,
  uploadMedia,
  deleteMedia,
} from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import RecipeMetadata from './RecipeMetadata';

interface RecipeViewProps {
  recipeId: string;
  onOpenSidebar?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps): React.JSX.Element {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ flex: 1, overflow: 'auto', pt: 2 }}
    >
      {value === index && children}
    </Box>
  );
}

function MediaThumbnail({ item }: { item: MediaItem }): React.JSX.Element {
  if (item.content_type.startsWith('image/')) {
    return (
      <CardMedia
        component="img"
        image={item.url}
        alt={item.label || item.filename}
        sx={{ height: 160, objectFit: 'cover' }}
      />
    );
  }
  if (item.content_type.startsWith('video/')) {
    return (
      <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.06)' }}>
        <PlayCircleIcon sx={{ fontSize: 56, color: 'primary.main' }} />
      </Box>
    );
  }
  if (item.content_type === 'application/pdf') {
    return (
      <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.06)' }}>
        <PictureAsPdfIcon sx={{ fontSize: 56, color: 'error.main' }} />
      </Box>
    );
  }
  return (
    <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.06)' }}>
      <InsertDriveFileIcon sx={{ fontSize: 56, color: 'text.secondary' }} />
    </Box>
  );
}

export default function RecipeView({ recipeId, onOpenSidebar }: RecipeViewProps): React.JSX.Element {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipe, setRecipe] = useState<RecipeMeta | null>(null);
  const [recipeText, setRecipeText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const [editingRecipe, setEditingRecipe] = useState<boolean>(false);
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [draftRecipeText, setDraftRecipeText] = useState<string>('');
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [snackMessage, setSnackMessage] = useState<string>('');

  const [uploading, setUploading] = useState<boolean>(false);
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const loadRecipeData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setEditingRecipe(false);
    setEditingNotes(false);
    try {
      const [meta, text, notesText, media] = await Promise.all([
        getRecipe(recipeId),
        getRecipeText(recipeId),
        getRecipeNotes(recipeId),
        listMedia(recipeId),
      ]);
      setRecipe(meta);
      setRecipeText(text);
      setNotes(notesText);
      setMediaItems(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    setActiveTab(0);
    loadRecipeData();
  }, [recipeId, loadRecipeData]);

  const handleSaveRecipeText = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      await updateRecipeText(recipeId, draftRecipeText);
      setRecipeText(draftRecipeText);
      setEditingRecipe(false);
      setSnackMessage('Recipe saved!');
    } catch (err) {
      setSnackMessage('Failed to save recipe.');
      console.error('Failed to save recipe text:', err);
    } finally {
      setSaving(false);
    }
  }, [recipeId, draftRecipeText]);

  const handleSaveNotes = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      await updateRecipeNotes(recipeId, draftNotes);
      setNotes(draftNotes);
      setEditingNotes(false);
      setSnackMessage('Notes saved!');
    } catch (err) {
      setSnackMessage('Failed to save notes.');
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  }, [recipeId, draftNotes]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const item = await uploadMedia(recipeId, file);
        setMediaItems((prev) => [...prev, item]);
        setSnackMessage('Media uploaded!');
      } catch (err) {
        setSnackMessage(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [recipeId],
  );

  const handleDeleteMedia = useCallback(
    async (item: MediaItem): Promise<void> => {
      try {
        await deleteMedia(recipeId, item.id);
        setMediaItems((prev) => prev.filter((m) => m.id !== item.id));
        setSnackMessage('Media deleted.');
      } catch (err) {
        setSnackMessage(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [recipeId],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error || 'Recipe not found'}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          {onOpenSidebar && (
            <IconButton
              size="small"
              onClick={onOpenSidebar}
              sx={{ display: { md: 'none' }, mt: 0.5 }}
              aria-label="Open recipe list"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'text.primary',
              flex: 1,
              fontSize: { xs: '1.4rem', md: '2.125rem' },
            }}
          >
            {recipe.name}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <RecipeMetadata recipe={recipe} />
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val: number) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><span>📜</span><span style={{ display: 'inline' }}>Recipe</span></Box>}
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>📷</span>
                  <span>Media</span>
                  {mediaItems.length > 0 && (
                    <Chip label={mediaItems.length} size="small" sx={{ height: 16, fontSize: '0.65rem', ml: 0.25 }} />
                  )}
                </Box>
              }
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab
              label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><span>📝</span><span>Notes</span></Box>}
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
            {user && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                {editingRecipe ? (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingRecipe(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
                      onClick={handleSaveRecipeText}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Tooltip title="Edit recipe">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDraftRecipeText(recipeText);
                        setEditingRecipe(true);
                      }}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
            {editingRecipe ? (
              <TextField
                fullWidth
                multiline
                rows={20}
                value={draftRecipeText}
                onChange={(e) => setDraftRecipeText(e.target.value)}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Roboto", sans-serif',
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  color: 'text.primary',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  minHeight: 200,
                }}
              >
                {recipeText || <Typography color="text.secondary">No recipe text yet.</Typography>}
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
            {user && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload File'}
                </Button>
              </Box>
            )}

            {mediaItems.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  gap: 2,
                  color: 'text.disabled',
                }}
              >
                <Typography sx={{ fontSize: '4rem' }}>📷</Typography>
                <Typography variant="h6" color="text.secondary">
                  No media yet
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {user
                    ? 'Click "Upload File" to add photos, videos, or documents.'
                    : 'Sign in to upload media files.'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {mediaItems.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <Card
                      elevation={0}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
                    >
                      <MediaThumbnail item={item} />
                      <CardActions
                        sx={{
                          justifyContent: 'space-between',
                          px: 1.5,
                          py: 1,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ maxWidth: 140 }}
                          title={item.label || item.filename}
                        >
                          {item.label || item.filename}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {item.content_type.startsWith('image/') && (
                            <Tooltip title="View full size">
                              <IconButton size="small" onClick={() => setLightboxItem(item)}>
                                <ZoomInIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {item.content_type.startsWith('video/') && (
                            <Tooltip title="Open video">
                              <IconButton size="small" component="a" href={item.url} target="_blank" rel="noopener noreferrer">
                                <PlayCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!item.content_type.startsWith('image/') && !item.content_type.startsWith('video/') && (
                            <Tooltip title="Open file">
                              <IconButton size="small" component="a" href={item.url} target="_blank" rel="noopener noreferrer">
                                <InsertDriveFileIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {user && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                sx={{ color: 'error.main' }}
                                onClick={() => handleDeleteMedia(item)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
            {user && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                {editingNotes ? (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingNotes(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
                      onClick={handleSaveNotes}
                      disabled={saving}
                    >
                      Save Notes
                    </Button>
                  </>
                ) : (
                  <Tooltip title="Edit notes">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDraftNotes(notes);
                        setEditingNotes(true);
                      }}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
            {editingNotes ? (
              <TextField
                fullWidth
                multiline
                rows={16}
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Add your personal notes here..."
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    lineHeight: 1.7,
                  },
                }}
              />
            ) : (
              <Box
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"Roboto", sans-serif',
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  color: 'text.primary',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  minHeight: 200,
                }}
              >
                {notes || <Typography color="text.secondary">No notes yet. Click edit to add your thoughts!</Typography>}
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Dialog
        open={!!lightboxItem}
        onClose={() => setLightboxItem(null)}
        maxWidth="lg"
        fullWidth
      >
        {lightboxItem && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body1" noWrap sx={{ flex: 1 }}>
                {lightboxItem.label || lightboxItem.filename}
              </Typography>
              <IconButton onClick={() => setLightboxItem(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 1, bgcolor: 'black' }}>
              <img
                src={lightboxItem.url}
                alt={lightboxItem.label || lightboxItem.filename}
                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar
        open={!!snackMessage}
        autoHideDuration={3000}
        onClose={() => setSnackMessage('')}
        message={snackMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}