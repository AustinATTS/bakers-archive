/**
 * Dialog for creating a new recipe.
 */

'use client';

import React, { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { createRecipe, RecipeMeta, RecipeCreatePayload } from '@/lib/api';

const BREAD_TYPES = [
  'sourdough',
  'enriched',
  'flatbread',
  'lean',
  'rye',
  'whole wheat',
  'multigrain',
  'white',
  'other',
];

const STEPS = ['Basic Info', 'Ingredients & Tags', 'Recipe Text & Notes'];

interface CreateRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (recipe: RecipeMeta) => void;
}

export default function CreateRecipeDialog({
  open,
  onClose,
  onCreated,
}: CreateRecipeDialogProps): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [breadType, setBreadType] = useState<string>('sourdough');
  const [book, setBook] = useState<string>('');

  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  const [recipeText, setRecipeText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const resetForm = useCallback((): void => {
    setActiveStep(0);
    setError('');
    setName('');
    setAuthor('');
    setBreadType('sourdough');
    setBook('');
    setIngredients(['']);
    setTagInput('');
    setTags([]);
    setRecipeText('');
    setNotes('');
  }, []);

  const handleClose = useCallback((): void => {
    if (!saving) {
      resetForm();
      onClose();
    }
  }, [saving, resetForm, onClose]);

  const handleNext = useCallback((): void => {
    setError('');
    if (activeStep === 0) {
      if (!name.trim()) { setError('Recipe name is required.'); return; }
      if (!author.trim()) { setError('Author is required.'); return; }
    }
    setActiveStep((s) => s + 1);
  }, [activeStep, name, author]);

  const handleBack = useCallback((): void => {
    setError('');
    setActiveStep((s) => s - 1);
  }, []);

  const handleAddIngredient = useCallback((): void => {
    setIngredients((prev) => [...prev, '']);
  }, []);

  const handleIngredientChange = useCallback((index: number, value: string): void => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? value : ing)));
  }, []);

  const handleRemoveIngredient = useCallback((index: number): void => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddTag = useCallback((): void => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag],
  );

  const handleRemoveTag = useCallback((tag: string): void => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      const payload: RecipeCreatePayload = {
        name: name.trim(),
        author: author.trim(),
        book: book.trim(),
        type: breadType,
        ingredients: ingredients.filter((i) => i.trim()),
        tags,
        recipe_text: recipeText,
        notes,
      };
      const created = await createRecipe(payload);
      resetForm();
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe');
    } finally {
      setSaving(false);
    }
  }, [name, author, book, breadType, ingredients, tags, recipeText, notes, resetForm, onCreated]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif' }}>
        🍞 New Recipe
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Recipe Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Bread Type"
              value={breadType}
              onChange={(e) => setBreadType(e.target.value)}
              select
              fullWidth
            >
              {BREAD_TYPES.map((t) => (
                <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Book / Source (optional)"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              fullWidth
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Ingredients
            </Typography>
            {ingredients.map((ing, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={ing}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1}`}
                  size="small"
                  fullWidth
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveIngredient(index)}
                  disabled={ingredients.length === 1}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddIngredient}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Ingredient
            </Button>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
                size="small"
                fullWidth
              />
              <Button size="small" variant="outlined" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{ bgcolor: 'secondary.light' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Recipe Instructions"
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              multiline
              rows={10}
              fullWidth
              placeholder="Write your recipe instructions here..."
              sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem' } }}
            />
            <TextField
              label="Personal Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Any personal notes or tips..."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={saving}>
            Back
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={saving}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Creating…' : 'Create Recipe'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}