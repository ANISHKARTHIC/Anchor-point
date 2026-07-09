## Generating migrations
- **Autogenerating migration file**:
   After making changes in model schema, run this command to generate migration file for the changes made
    ```
    alembic -c src/migrations/alembic.ini revision --autogenerate -m "<meaningful_filename_describing_migration>"
    ```

    The generated migrations file will have the commands describing the changes made in models schema. Cross check whether the
    generated commands are correct. If not, the incorrect commands need to corrected manually.

- **Running the migration file**:
    After the generated migration file(s) are verified for correctness, there are two ways to run the migrations. All migrations should be applied in the order they are created.
    - To run a specific migration file (revision_id is found in the migration file)
    ```
    alembic -c src/migrations/alembic.ini upgrade <revision_id>
    ```
    - To run multiple migration files (this runs 2 latest added migrations)
    ```
    alembic -c src/migrations/alembic.ini upgrade +2
    ```

    - To run all latest migration files
    ```
    alembic -c src/migrations/alembic.ini upgrade head
    ```
- **Downgrading migrations**: We can undo any applied migrations as well.
    - To undo the last applied migrations
    ```
    alembic -c src/migrations/alembic.ini downgrade -1
    ```

    - To undo applied migrations till a specific migration revision
    ```
    alembic -c src/migrations/alembic.ini downgrade <revision_id>
    ```
<br>

## Alembic migrations documentation link
[Documentation for Alembic](https://alembic.sqlalchemy.org/en/latest/index.html)