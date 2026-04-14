/**
 * API client for The Baker's Archive backend.
 */

import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://bakers-archive-api.austinatts.co.uk';

export interface RecipeMeta {
  id: string;
  name: string;
  author: string;
  book: string;
  type: string;
  ingredients: string[];
  tags: string[];
}

export interface RecipeCreatePayload {
  name: string;
  author: string;
  book: string;
  type: string;
  ingredients: string[];
  tags: string[];
  recipe_text: string;
  notes: string;
}

export interface SearchParams {
  query?: string;
  type?: string;
  author?: string;
  tags?: string;
}

export interface MediaItem {
  id: string;
  recipe_id: string;
  filename: string;
  content_type: string;
  url: string;
  label: string;
  created_at: string | null;
}

export interface UserPublic {
  username: string;
  is_admin: boolean;
}

export interface AdminStats {
  total_recipes: number;
  total_users: number;
  total_media: number;
  db_type: string;
  db_size_bytes: number;
  blob_enabled: boolean;
  blob_item_count: number;
  vercel_api_url: string;
  vercel_frontend_url: string;
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

export async function createRecipe(payload: RecipeCreatePayload): Promise<RecipeMeta> {
  const res = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Failed to create recipe: ${res.statusText}`);
  }
  return res.json() as Promise<RecipeMeta>;
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const res = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete recipe: ${res.statusText}`);
}

export interface RecipeUpdatePayload {
  name?: string;
  author?: string;
  book?: string;
  type?: string;
  ingredients?: string[];
  tags?: string[];
}

export async function updateRecipeMeta(recipeId: string, payload: RecipeUpdatePayload): Promise<RecipeMeta> {
  const res = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/meta`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Failed to update recipe: ${res.statusText}`);
  }
  return res.json() as Promise<RecipeMeta>;
}

export async function listMedia(recipeId: string): Promise<MediaItem[]> {
  const res = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/media`);
  if (!res.ok) throw new Error(`Failed to list media: ${res.statusText}`);
  return res.json() as Promise<MediaItem[]>;
}

export async function uploadMedia(recipeId: string, file: File, label?: string): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (label) formData.append('label', label);
  const res = await fetch(`${API_URL}/recipes/${encodeURIComponent(recipeId)}/media`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Failed to upload media: ${res.statusText}`);
  }
  return res.json() as Promise<MediaItem>;
}

export async function deleteMedia(recipeId: string, mediaId: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/recipes/${encodeURIComponent(recipeId)}/media/${encodeURIComponent(mediaId)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`Failed to delete media: ${res.statusText}`);
}

export async function adminListUsers(): Promise<UserPublic[]> {
  const res = await fetch(`${API_URL}/admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to list users: ${res.statusText}`);
  return res.json() as Promise<UserPublic[]>;
}

export async function adminCreateUser(
  username: string,
  password: string,
  is_admin: boolean,
): Promise<UserPublic> {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ username, password, is_admin }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Failed to create user: ${res.statusText}`);
  }
  return res.json() as Promise<UserPublic>;
}

export async function adminDeleteUser(username: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Failed to delete user: ${res.statusText}`);
  }
}

export async function adminGetStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to get stats: ${res.statusText}`);
  return res.json() as Promise<AdminStats>;
}