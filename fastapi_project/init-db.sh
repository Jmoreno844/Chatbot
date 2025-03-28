#!/bin/bash
set -e

# Load environment variables from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/.env"

# Print variables for debugging
echo "Connecting to PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT"
echo "User: $POSTGRES_USER, Database: postgres"

# Create user if not exists - connecting explicitly to postgres database
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -v ON_ERROR_STOP=1 <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
            CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
        END IF;
    END
    \$\$;
EOSQL

# Check if database exists
DB_EXISTS=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -t -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")

# Create database if it doesn't exist
if [ -z "$DB_EXISTS" ]; then
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME};"
    echo "Database ${DB_NAME} created"
else
    echo "Database ${DB_NAME} already exists"
fi

# Grant privileges
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "postgres" -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# Connect to the newly created database to set schema permissions
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "${DB_NAME}" -v ON_ERROR_STOP=1 <<-EOSQL
    GRANT ALL ON SCHEMA public TO ${DB_USER};
EOSQL

echo "Database initialization completed successfully!"