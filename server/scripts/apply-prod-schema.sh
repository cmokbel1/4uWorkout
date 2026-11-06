#!/usr/bin/env bash
# Applies src/db/schema.sql to the production database (trainer-prod-db),
# using your doctl login for the connection details. ALTER TABLE only works for
# the tables' owner, so it shows the owner and the current state first, and
# asks before changing anything.
#
#   bash scripts/apply-prod-schema.sh [db-user]   # default: trainer_prod_db_admin
#
# Needs doctl (authenticated), jq, python3 and Node >= 20.12, and this
# machine's IP in the cluster's trusted sources (see CLAUDE.md).
set -euo pipefail
umask 077

CLUSTER=96f5d06b-39cb-4566-8e04-6ea842b609c7
DB=trainer-prod-db
DB_USER=${1:-trainer_prod_db_admin}
SERVER=$(cd "$(dirname "$0")/.." && pwd)

# The connection string holds the password, so it lives outside the repo and
# is removed however the script ends.
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
ENV_FILE="$TMP_DIR/prod.env"

conn=$(doctl databases connection "$CLUSTER" -o json)
pw=$(doctl databases user get "$CLUSTER" "$DB_USER" -o json | jq -r '.[0].password')
host=$(jq -r '.host' <<<"$conn")
port=$(jq -r '.port' <<<"$conn")
enc=$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$pw")
ca=$(doctl databases get-ca "$CLUSTER" -o json | jq -r '.certificate' | base64 -d)
{
  echo "DATABASE_URL=postgresql://${DB_USER}:${enc}@${host}:${port}/${DB}"
  printf 'DATABASE_CA_CERT="%s"\n' "$ca"
} >"$ENV_FILE"
unset pw enc conn

cd "$SERVER"
npx tsc

check() {
  node --env-file="$ENV_FILE" -e "
    const { getPool } = require('./dist/lib/db')
    ;(async () => {
      const p = getPool()
      const q = (sql) => p.query(sql).then((r) => r.rows)
      console.log('connected as:', (await q('select current_user'))[0].current_user)
      console.log('tables:', await q(\"select tablename, tableowner from pg_tables where schemaname = 'public'\"))
      const col = await q(\"select 1 from information_schema.columns where table_name = 'exercises' and column_name = 'public_id'\")
      console.log('public_id exists:', col.length > 0)
      if (col.length) console.log('rows missing public_id:', (await q('select count(*) from exercises where public_id is null'))[0].count)
      console.log('exercises:', (await q('select count(*) from exercises'))[0].count)
      await p.end()
    })().catch((e) => { console.error(e.message); process.exit(1) })"
}

check
read -r -p "Apply schema.sql to $DB as $DB_USER? [y/N] " answer
[[ "$answer" == y || "$answer" == Y ]] || { echo "Not applied."; exit 0; }
node --env-file="$ENV_FILE" dist/scripts/applySchema.js
check
