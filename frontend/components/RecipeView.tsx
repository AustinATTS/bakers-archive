/**
 * Recipe view component with tabbed interface.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import Snackbar from '@mui/material/Snackbar';

import {
  RecipeMeta,
  getRecipe,
  getRecipeText,
  getRecipeNotes,
  updateRecipeText,
  updateRecipeNotes,
} from '@/lib/api';
import RecipeMetadata from './RecipeMetadata';

interface RecipeViewProps {
  recipeId: string;
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

export default function RecipeView({ recipeId }: RecipeViewProps): React.JSX.Element {
  const [recipe, setRecipe] = useState<RecipeMeta | null>(null);
  const [recipeText, setRecipeText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const [editingRecipe, setEditingRecipe] = useState<boolean>(false);
  const [editingNotes, setEditingNotes] = useState<boolean>(false);
  const [draftRecipeText, setDraftRecipeText] = useState<string>('');
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [snackMessage, setSnackMessage] = useState<string>('');

  const loadRecipeData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setEditingRecipe(false);
    setEditingNotes(false);
    try {
      const [meta, text, notesText] = await Promise.all([
        getRecipe(recipeId),
        getRecipeText(recipeId),
        getRecipeNotes(recipeId),
      ]);
      setRecipe(meta);
      setRecipeText(text);
      setNotes(notesText);
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
    } finally {
      setSaving(false);
    }
  }, [recipeId, draftNotes]);

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
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            color: 'text.primary',
          }}
        >
          {recipe.name}
        </Typography>
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
          >
            <Tab label="📜 Recipe" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="📷 Media" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="📝 Notes" id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
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
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              pb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              gap: 2,
            }}
          >
            <PhotoLibraryIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              No photos yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Media upload functionality coming soon. 📷
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
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
