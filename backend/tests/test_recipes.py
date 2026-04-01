# Unit tests for The Baker's Archive API.

import os
import shutil
from typing import Generator
import pytest
from fastapi.testclient import TestClient

TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "test_data_tmp")
os.environ["DATA_DIR"] = TEST_DATA_DIR

from app.main import app
from app import storage

@pytest.fixture(autouse=True)
def clean_test_data() -> Generator:
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)
    os.makedirs(os.path.join(TEST_DATA_DIR, "recipes"), exist_ok=True)
    storage.DATA_DIR = TEST_DATA_DIR
    storage.RECIPES_DIR = os.path.join(TEST_DATA_DIR, "recipes")
    yield
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_recipe(client: TestClient) -> dict:
    payload = {
        "name": "Test Sourdough",
        "author": "Test Baker",
        "book": "Test Book",
        "type": "sourdough",
        "ingredients": ["flour", "water", "salt", "starter"],
        "tags": ["sourdough", "artisan"],
        "recipe_text": "Mix ingredients and bake.",
        "notes": "Great recipe!",
    }
    response = client.post("/recipes", json=payload)
    assert response.status_code == 201
    return response.json()


class TestListRecipes:
    def test_list_empty(self, client: TestClient) -> None:
        response = client.get("/recipes")
        assert response.status_code == 200
        assert response.json() == []

    def test_list_after_create(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Sourdough"


class TestGetRecipe:
    def test_get_existing(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.get(f"/recipes/{recipe_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == recipe_id
        assert data["author"] == "Test Baker"

    def test_get_not_found(self, client: TestClient) -> None:
        response = client.get("/recipes/nonexistent-recipe")
        assert response.status_code == 404


class TestCreateRecipe:
    def test_create_basic(self, client: TestClient) -> None:
        payload = {
            "name": "Rye Bread",
            "author": "Baker Joe",
            "type": "rye",
            "ingredients": ["rye flour", "water", "salt"],
            "tags": ["rye"],
        }
        response = client.post("/recipes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Rye Bread"
        assert data["type"] == "rye"
        assert "id" in data

    def test_create_generates_slug_id(self, client: TestClient) -> None:
        payload = {
            "name": "My Special Loaf",
            "author": "Baker",
            "type": "white",
            "ingredients": [],
            "tags": [],
        }
        response = client.post("/recipes", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "my-special-loaf" in data["id"]


class TestDeleteRecipe:
    def test_delete_existing(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.delete(f"/recipes/{recipe_id}")
        assert response.status_code == 204
        get_response = client.get(f"/recipes/{recipe_id}")
        assert get_response.status_code == 404

    def test_delete_not_found(self, client: TestClient) -> None:
        response = client.delete("/recipes/does-not-exist")
        assert response.status_code == 404


class TestRecipeText:
    def test_get_recipe_text(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.get(f"/recipes/{recipe_id}/recipe")
        assert response.status_code == 200
        assert response.json()["content"] == "Mix ingredients and bake."

    def test_update_recipe_text(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.put(
            f"/recipes/{recipe_id}/recipe",
            json={"content": "New instructions."},
        )
        assert response.status_code == 200
        get_response = client.get(f"/recipes/{recipe_id}/recipe")
        assert get_response.json()["content"] == "New instructions."

    def test_get_text_not_found(self, client: TestClient) -> None:
        response = client.get("/recipes/nonexistent/recipe")
        assert response.status_code == 404


class TestNotes:
    def test_get_notes(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.get(f"/recipes/{recipe_id}/notes")
        assert response.status_code == 200
        assert response.json()["content"] == "Great recipe!"

    def test_update_notes(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.put(
            f"/recipes/{recipe_id}/notes",
            json={"content": "Updated notes."},
        )
        assert response.status_code == 200
        get_response = client.get(f"/recipes/{recipe_id}/notes")
        assert get_response.json()["content"] == "Updated notes."

    def test_notes_not_found(self, client: TestClient) -> None:
        response = client.get("/recipes/nonexistent/notes")
        assert response.status_code == 404


class TestSearch:
    def test_search_by_name(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes/search?q=sourdough")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(r["name"] == "Test Sourdough" for r in data)

    def test_search_by_type(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes/search?type=sourdough")
        assert response.status_code == 200
        data = response.json()
        assert all(r["type"] == "sourdough" for r in data)

    def test_search_by_author(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes/search?author=Test+Baker")
        assert response.status_code == 200
        data = response.json()
        assert all(r["author"] == "Test Baker" for r in data)

    def test_search_by_tag(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes/search?tags=artisan")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_no_match(self, client: TestClient, sample_recipe: dict) -> None:
        response = client.get("/recipes/search?q=zzznomatchzzz")
        assert response.status_code == 200
        assert response.json() == []