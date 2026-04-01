/**
 * Search bar component for filtering recipes.
 */
'use client';

import React, { useCallback } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ value, onSearch }: SearchBarProps): React.JSX.Element {
  const handleChange = useCallback(
    (element: React.ChangeEvent<HTMLInputElement>): void => {
      onSearch(element.target.value);
    },
    [onSearch],
  );

  const handleClear = useCallback((): void => {
    onSearch('');
  }, [onSearch]);

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Search recipes..."
      value={value}
      onChange={handleChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleClear} edge="end">
              <ClearIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.default',
          borderRadius: 2,
        },
      }}
    />
  );
}
