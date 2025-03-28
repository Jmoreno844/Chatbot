


### Alembic

# Create an initial migration
alembic revision --autogenerate -m "create users table"
# Apply the migration
alembic upgrade head