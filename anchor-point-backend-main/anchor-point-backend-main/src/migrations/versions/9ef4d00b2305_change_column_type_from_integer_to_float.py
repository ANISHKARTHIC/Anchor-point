"""Change column type from integer to float

Revision ID: 9ef4d00b2305
Revises: f45fd222f4ae
Create Date: 2025-09-05 10:28:40.782811

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9ef4d00b2305'
down_revision: Union[str, None] = 'f45fd222f4ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Change column type from Integer to Float
    op.alter_column(
        'vendor_invoices', # Table name
        'extra_kms_qty', # Column name
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=False  # Keep NULL/NOT NULL as before
    )
    op.alter_column(
        'vendor_invoices', # Table name
        'extra_hrs_qty', # Column name
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=False  # Keep NULL/NOT NULL as before
    )
    op.alter_column(
        'invoices', # Table name
        'extra_kms', # Column name
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=False  # Keep NULL/NOT NULL as before
    )
    op.alter_column(
        'invoices', # Table name
        'extra_hrs', # Column name
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=False  # Keep NULL/NOT NULL as before
    )


def downgrade():
    # Revert column type from Float back to Integer
    op.alter_column(
        'vendor_invoices',          # Table name
        'extra_kms_qty',
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=False
    )
    op.alter_column(
        'vendor_invoices',          # Table name
        'extra_hrs_qty',
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=False
    )
    op.alter_column(
        'invoices',          # Table name
        'extra_kms',
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=False
    )
    op.alter_column(
        'invoices',          # Table name
        'extra_hrs',
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=False
    )