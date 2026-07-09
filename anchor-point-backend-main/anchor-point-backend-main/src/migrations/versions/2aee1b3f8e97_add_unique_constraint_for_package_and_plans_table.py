"""add_unique_constraint_for_package_and_plans_table>

Revision ID: 2aee1b3f8e97
Revises: b304fb939439
Create Date: 2024-04-19 17:48:50.761394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2aee1b3f8e97'
down_revision: Union[str, None] = 'b304fb939439'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define the upgrade and downgrade functions
def upgrade():
    op.create_unique_constraint(
        'uq_distance_duration',  # Unique constraint name
        'packages',                      # Table name
        ['distance_kms', 'interval_hrs']           # Columns involved in the unique constraint
    )
    op.create_unique_constraint(
        'uq_package_vehicle_vendor',  # Unique constraint name
        'plans',                      # Table name
        ['package_id', 'vehicle_id', 'vendor_id']  # Columns involved in the unique constraint
    )

def downgrade():
    op.drop_constraint(
        'uq_distance_duration',  # Unique constraint name
        'packages',                      # Table name
        type_='unique'                  # Constraint type
    )
    op.drop_constraint(
        'uq_package_vehicle_vendor',  # Unique constraint name
        'plans',                      # Table name
        type_='unique'                  # Constraint type
    )