/**
 * API client for The Baker's Archive backend.
 */

import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface RecipeMeta {
  id: string;
  name: string;
  author: string;
  book: string;
  type: string;
  ingredients: string[];
  tags: string[];
}

export interface SearchParams {
  query?: string;
  type?: string;
  author?: string;
  tags?: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listRecipes(): Promise<RecipeMeta[]> {
  const response = await fetch(`${API_URL}/recipes`);
  if (!response.ok) throw new Error(`Failed to list recipes: ${response.statusText}`);
  return response.json() as Promise<RecipeMeta[]>;
}

export async function searchRecipes(params: SearchParams): Promise<RecipeMeta[]> {
  const query = new URLSearchParams();
  if (params.query) query.set('query', params.query);
  if (params.type) query.set('type', params.type);
  if (params.author) query.set('author', params.author);
  if (params.tags) query.set('tags', params.tags);
  const response = await fetch(`${API_URL}/recipes/search?${query.toString()}`);
  if (!response.ok) throw new Error(`Failed to search recipes: ${response.statusText}`);
  return response.json() as Promise<RecipeMeta[]>;
}

export async function getRecipe(recipeId: string): Promise<RecipeMeta> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}`);
  if (!response.ok) throw new Error(`Failed to get recipe: ${response.statusText}`);
  return response.json() as Promise<RecipeMeta>;
}

export async function getRecipeText(recipeId: string): Promise<string> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/recipe`);
  if (!response.ok) throw new Error(`Failed to get recipe text: ${response.statusText}`);
  const data = (await response.json()) as { content: string };
  return data.content;
}

export async function getRecipeNotes(recipeId: string): Promise<string> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/notes`);
  if (!response.ok) throw new Error(`Failed to get recipe notes: ${response.statusText}`);
  const data = (await response.json()) as { content: string };
  return data.content;
}

export async function updateRecipeText(recipeId: string, content: string): Promise<void> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/recipe`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(`Failed to update recipe text: ${response.statusText}`);
}

export async function updateRecipeNotes(recipeId: string, content: string): Promise<void> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(`Failed to update recipe notes: ${response.statusText}`);
}