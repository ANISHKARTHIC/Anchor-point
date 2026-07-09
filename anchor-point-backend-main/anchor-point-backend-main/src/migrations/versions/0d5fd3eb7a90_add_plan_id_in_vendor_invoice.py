"""add plan id in vendor invoice

Revision ID: 0d5fd3eb7a90
Revises: 598942ac4601
Create Date: 2025-08-07 14:27:32.821422

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d5fd3eb7a90'
down_revision: Union[str, None] = '598942ac4601'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Add column as nullable first
    op.add_column('vendor_invoices', sa.Column('plan_id', sa.BigInteger(), nullable=True))

    # 2. Populate from bookings table
    op.execute("""
        UPDATE vendor_invoices
        SET plan_id = bookings.plan_id
        FROM bookings
        WHERE vendor_invoices.booking_id = bookings.id
    """)

    # 3. Set column to NOT NULL
    op.alter_column('vendor_invoices', 'plan_id', nullable=False)

    # 4. Add foreign key constraint
    op.create_foreign_key(
        'fk_vendor_invoices_plan_id',
        'vendor_invoices',        
        'plans',                      
        ['plan_id'],         
        ['id'],
        ondelete='CASCADE'            
    )
    op.add_column('vendor_invoices', sa.Column('extra_kms_qty', sa.Integer(), nullable=False, server_default="0"))
    op.add_column('vendor_invoices', sa.Column('extra_hrs_qty', sa.Integer(), nullable=False, server_default="0"))
    
    op.execute("""
        UPDATE vendor_invoices
        SET extra_kms_qty = 1
        WHERE extra_kms > 0
    """)

    op.execute("""
        UPDATE vendor_invoices
        SET extra_hrs_qty = 1
        WHERE extra_hrs > 0
    """)

def downgrade():
    # Drop FK first
    op.drop_constraint('fk_vendor_invoices_plan_id', 'vendor_invoices', type_='foreignkey')
    # Drop column
    op.drop_column('vendor_invoices', 'extra_kms_qty')
    op.drop_column('vendor_invoices', 'extra_hrs_qty')
    op.drop_column('vendor_invoices', 'plan_id')