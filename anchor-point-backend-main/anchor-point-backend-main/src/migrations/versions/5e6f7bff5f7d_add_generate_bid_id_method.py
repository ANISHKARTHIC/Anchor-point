"""add_generate_bid_id_method

Revision ID: 5e6f7bff5f7d
Revises: 8b00383fb63a
Create Date: 2024-05-02 17:48:59.892704

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.schema import DDL

# revision identifiers, used by Alembic.
revision: str = '5e6f7bff5f7d'
down_revision: Union[str, None] = '8b00383fb63a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Upgrade function
def upgrade():
    op.execute("""
    CREATE FUNCTION generate_bid_id()
    RETURNS text
    AS $$
    BEGIN
        RETURN 'BID' || CAST(nextval('bid_seq') AS text);
    END;
    $$ LANGUAGE plpgsql;
    """)
    op.alter_column('bookings', 'bid', nullable=False, unserver_default=DDL('generate_bid_id()'))
    op.create_unique_constraint("uq_bookings_bid", "bookings", ["bid"])

# Downgrade function
def downgrade():
    op.execute('DROP FUNCTION generate_bid_id')
    op.drop_constraint("uq_bookings_bid", "bookings")

