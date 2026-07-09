"""Add city id in bookings table

Revision ID: 598942ac4601
Revises: 7e7b4ea916fa
Create Date: 2025-07-16 12:09:27.623197

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '598942ac4601'
down_revision: Union[str, None] = '7e7b4ea916fa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Add the new column
    op.add_column('bookings', sa.Column('city_id', sa.Integer(), nullable=True))

    # 2. Set city_id from vendors
    op.execute("""
        UPDATE bookings b
        SET city_id = v.city_id
        FROM vendors v
        WHERE v.id = b.vendor_id;
    """)

    # 3. (Optional) Add foreign key constraint to cities table
    op.create_foreign_key(
        'fk_bookings_city_id',
        'bookings',
        'vendor_cities',
        ['city_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.add_column('invoices', sa.Column('extra_kms', sa.Integer(), nullable=False, server_default="0"))
    op.add_column('invoices', sa.Column('extra_hrs', sa.Integer(), nullable=False, server_default="0"))
    op.add_column('invoices', sa.Column('extra_distance_cost', sa.DOUBLE_PRECISION(precision=53), nullable=False, server_default="0.00"))
    op.add_column('invoices', sa.Column('extra_hour_cost', sa.DOUBLE_PRECISION(precision=53), nullable=False, server_default="0.00"))


def downgrade():
    # Drop the foreign key first
    op.drop_constraint('fk_bookings_city_id', 'bookings', type_='foreignkey')
    # Drop the column
    op.drop_column('bookings', 'city_id')
    op.drop_column('invoices', 'extra_kms')
    op.drop_column('invoices', 'extra_hrs')
    op.drop_column('invoices', 'extra_distance_cost')
    op.drop_column('invoices', 'extra_hour_cost')