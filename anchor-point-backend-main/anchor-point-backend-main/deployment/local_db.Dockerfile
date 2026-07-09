# Use the PostgreSQL base image
FROM postgres:14.5

# Install the necessary dependencies and pg_cron extension
RUN apt-get update && \
    apt-get install -y postgresql-contrib && \
    apt-get install -y postgresql-14-cron nano && \
    rm -rf /var/lib/apt/lists/*