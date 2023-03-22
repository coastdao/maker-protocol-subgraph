#!/usr/bin/env bash
set -e


ETH_RPC_PORT=${ETH_RPC_PORT:-8545}
ETH_RPC_HOST=${ETH_RPC_HOST:-$(ifconfig | grep 'inet ' | grep -v '\.0\.' | awk '(NR==1){print $2}')}
ETH_RPC_URL=${ETH_RPC_URL:-"http://$ETH_RPC_HOST:$ETH_RPC_PORT"}
OUT_DIR=${OUT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]%/*}")" && pwd)}

echo "OUT_DIR: $OUT_DIR"
if [ "$1" == 'init' ]; then
  if [ -d "$OUT_DIR/data" ]; then
    read -r -p "Are you sure you want to delete all the data and start over? [y/N] " input
    if [[ "$input" != "y" && "$input" != "Y" ]]; then
      run
    else
      rm -rf "$OUT_DIR/data"
      rm -rf "$OUT_DIR/graph-node.yml"
    fi
  fi
  mkdir -p "$OUT_DIR/data"
  echo "ETH_RPC_URL=$ETH_RPC_URL"

  cat <<EOF >"$OUT_DIR/graph-node.yml"
version: '3'
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000'
      - '8001:8001'
      - '8020:8020'
      - '8030:8030'
      - '8040:8040'
    depends_on:
      - ipfs
      - postgres
    extra_hosts:
      - host.docker.internal:host-gateway
    environment:
      postgres_host: postgres
      postgres_user: graph-node
      postgres_pass: let-me-in
      postgres_db: graph-node
      ipfs: 'ipfs:5001'
      ethereum: 'testnet:$ETH_RPC_URL'
      GRAPH_LOG: info
  ipfs:
    image: ipfs/go-ipfs:v0.10.0
    ports:
      - '5001:5001'
    volumes:
      - ./data/ipfs:/data/ipfs
  postgres:
    image: postgres
    ports:
      - '5432:5432'
    command:
      [
        "postgres",
        "-cshared_preload_libraries=pg_stat_statements"
      ]
    environment:
      POSTGRES_USER: graph-node
      POSTGRES_PASSWORD: let-me-in
      POSTGRES_DB: graph-node
      # FIXME: remove this env. var. which we shouldn't need. Introduced by
      # <https://github.com/graphprotocol/graph-node/pull/3511>, maybe as a
      # workaround for https://github.com/docker/for-mac/issues/6270?
      PGDATA: "/var/lib/postgresql/data"
      POSTGRES_INITDB_ARGS: "-E UTF8 --locale=C"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
EOF
fi

echo "Starting graph-node..."
docker-compose -f "${OUT_DIR}/graph-node.yml" up -d
echo "graph-node started."
