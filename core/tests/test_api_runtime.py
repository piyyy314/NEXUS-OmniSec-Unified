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



def test_app_refuses_to_start_without_api_key(monkeypatch):
    monkeypatch.delenv("SHADOW313_API_KEY", raising=False)
    try:
        create_app()
    except RuntimeError as exc:
        assert "SHADOW313_API_KEY" in str(exc)
    else:
        raise AssertionError("API must not start without an authentication key")



def test_webshell_scan_detection_is_published_to_event_feed():
    client = TestClient(create_app(api_key="test-secret"))
    response = client.post(
        "/api/webshell/scan",
        headers={"X-API-Key": "test-secret"},
        json={
            "content": "<?php eval(base64_decode($_POST['cmd'])); ?>",
            "file_path": "uploads/suspicious.php",
            "mode": "content",
        },
    )
    assert response.status_code == 200
    assert response.json()["detected"] is True

    events = client.get(
        "/api/events?since=0",
        headers={"X-API-Key": "test-secret"},
    )
    assert events.status_code == 200
    assert events.json()["count"] == 1
    assert events.json()["events"][0]["source"] == "webshell_scan"
    assert events.json()["events"][0]["technique"] == "T1505.003"
