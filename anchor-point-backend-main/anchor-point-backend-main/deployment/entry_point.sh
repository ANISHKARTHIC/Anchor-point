#!/bin/bash

poetry run alembic -c src/migrations/alembic.ini upgrade head

# $? returns the exit code of last run command
migration_exec_status=$? 

# exit code other than 0 indicates failure
if [ $migration_exec_status -eq 0 ]
then
    echo "Migrations done successfully"
    cd src/
    poetry run python3 app.py
else
    echo "Migrations failed!!"
fi
