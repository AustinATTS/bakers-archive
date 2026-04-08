# Unit tests for The Baker's Archive API.

import os
import shutil
from typing import Generator
import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:////tmp/archive_test.db"
os.environ["ADMIN_USERNAME"] = "testadmin"
os.environ["ADMIN_PASSWORD"] = "testpass"

from app.main import app
from app import storage

@pytest.fixture(autouse=True)
def clean_test_data() -> Generator:
    storage.Base.metadata.drop_all(bind=storage.engine)
    storage.init_db()
    yield
    storage.Base.metadata.drop_all(bind=storage.engine)

@pytest.fixture
def client() -> TestClient:
    return TestClient(app)

@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    with client:
        response = client.post(
            "/auth/login",
            json={"username": "testadmin", "password": "testpass"},
        )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_recipe(client: TestClient, auth_headers: dict) -> dict:
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
    response = client.post("/recipes", json=payload, headers=auth_headers)
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
        assert any(r["name"] == "Test Sourdough" for r in data)


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
    def test_create_basic(self, client: TestClient, auth_headers: dict) -> None:
        payload = {
            "name": "Rye Bread",
            "author": "Baker Joe",
            "type": "rye",
            "ingredients": ["rye flour", "water", "salt"],
            "tags": ["rye"],
        }
        response = client.post("/recipes", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Rye Bread"
        assert data["type"] == "rye"
        assert "id" in data

    def test_create_generates_slug_id(self, client: TestClient, auth_headers: dict) -> None:
        payload = {
            "name": "My Special Loaf",
            "author": "Baker",
            "type": "white",
            "ingredients": [],
            "tags": [],
        }
        response = client.post("/recipes", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert "my-special-loaf" in data["id"]

    def test_create_requires_auth(self, client: TestClient) -> None:
        payload = {
            "name": "Unauthorized Bread",
            "author": "Baker",
            "type": "white",
            "ingredients": [],
            "tags": [],
        }
        response = client.post("/recipes", json=payload)
        assert response.status_code == 401

class TestDeleteRecipe:
    def test_delete_existing(self, client: TestClient, sample_recipe: dict, auth_headers: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.delete(f"/recipes/{recipe_id}", headers=auth_headers)
        assert response.status_code == 204
        get_response = client.get(f"/recipes/{recipe_id}")
        assert get_response.status_code == 404

    def test_delete_not_found(self, client: TestClient, auth_headers: dict) -> None:
        response = client.delete("/recipes/does-not-exist", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_requires_auth(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.delete(f"/recipes/{recipe_id}")
        assert response.status_code == 401


class TestRecipeText:
    def test_get_recipe_text(self, client: TestClient, sample_recipe: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.get(f"/recipes/{recipe_id}/recipe")
        assert response.status_code == 200
        assert response.json()["content"] == "Mix ingredients and bake."

    def test_update_recipe_text(self, client: TestClient, sample_recipe: dict, auth_headers: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.put(
            f"/recipes/{recipe_id}/recipe",
            json={"content": "New instructions."},
            headers=auth_headers,
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

    def test_update_notes(self, client: TestClient, sample_recipe: dict, auth_headers: dict) -> None:
        recipe_id = sample_recipe["id"]
        response = client.put(
            f"/recipes/{recipe_id}/notes",
            json={"content": "Updated notes."},
            headers=auth_headers,
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