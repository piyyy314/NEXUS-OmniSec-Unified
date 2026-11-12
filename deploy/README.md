# Shadow313 NEXUS deployment

## Requirements

- Linux host with Docker Engine and the Docker Compose v2 plugin
- At least 8 GB RAM for the configured Ollama service; more memory is recommended for larger models
- Disk space for container images, the model, and persistent application data

## Configure

Run these commands from the repository root:

```sh
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env` and replace both placeholder secrets with separate random values. For example:

```sh
openssl rand -hex 32
```

Prepare the persistent host data directory (the default is `/opt/shadow313/data`):

```sh
sudo sh deploy/bootstrap.sh
```

If you choose a custom `SHADOW313_DATA_DIR`, export that same value when running the bootstrap script and set it in `deploy/.env`.

## Start the stack

```sh
cd deploy
docker compose up -d --build
docker compose ps
docker compose logs -f ollama-init
```

The first startup pulls the configured Ollama model and can take time and substantial bandwidth. The Nginx HTTP endpoints are bound to loopback only:

- Web interface: `http://127.0.0.1/`
- Web interface alternate listener: `http://127.0.0.1:8080/`
- API through Nginx: `http://127.0.0.1/nexus-api/`

Use an SSH tunnel or a separately secured VPN/reverse proxy for remote access. Do not expose the API or Ollama ports directly to the public internet.

## Optional services

Start the interactive CLI on demand:

```sh
docker compose --profile cli run --rm shadow313-cli
```

Enable the Telegram bot only after configuring its token and chat ID in `.env`:

```sh
docker compose --profile telegram up -d telegram-bot
```

## Operations

```sh
docker compose ps
docker compose logs -f shadow313-api nginx
docker compose down
```

Persistent data is stored in the Docker volume mapped to `SHADOW313_DATA_DIR`; model and WebUI data use separate named volumes. `docker compose down -v` deletes named volumes and should not be used unless you intend to remove persisted model and application data.

## Validation

The GitHub Actions workflow checks Python syntax, parses and resolves the Compose configuration, and builds the NEXUS Docker image. A successful image build does not replace a deployment smoke test on the target host.
