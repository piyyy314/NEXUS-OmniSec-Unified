from fastapi.testclient import TestClient

from shadow313.api.server import create_app


def test_health_endpoint_is_public_for_container_healthchecks():
    client = TestClient(create_app(api_key="test-secret"))
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_event_feed_requires_api_key():
    client = TestClient(create_app(api_key="test-secret"))
    response = client.get("/api/events")
    assert response.status_code == 401


def test_event_feed_returns_bounded_empty_feed():
    client = TestClient(create_app(api_key="test-secret"))
    response = client.get(
        "/api/events?since=0&limit=500",
        headers={"X-API-Key": "test-secret"},
    )
    assert response.status_code == 200
    assert response.json() == {"count": 0, "events": []}


def test_protected_module_route_rejects_wrong_api_key():
    client = TestClient(create_app(api_key="test-secret"))
    response = client.get(
        "/api/modules",
        headers={"X-API-Key": "wrong-secret"},
    )
    assert response.status_code == 401
