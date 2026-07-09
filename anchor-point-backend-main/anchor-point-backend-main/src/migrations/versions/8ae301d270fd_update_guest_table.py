"""update_guest_table

Revision ID: 8ae301d270fd
Revises: 87abc76193e3
Create Date: 2025-01-24 10:22:59.039140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8ae301d270fd'
down_revision: Union[str, None] = '87abc76193e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # The SQL query to update the guest details in the booking_logs table
    op.alter_column('waypoints', 'guest_id',
                    existing_type=sa.BigInteger,  # Ensure the correct type is specified
                    nullable=True) 
    op.alter_column('waypoints', 'booking_id',
                    existing_type=sa.String,  # Ensure the correct type is specified
                    nullable=True) 
    op.add_column('waypoints', sa.Column('booking_log_id', sa.BigInteger, nullable=True)) 
    op.create_foreign_key('waypoint_booking_log_id_fkey', 'waypoints', 'booking_logs', ['booking_log_id'], ['id'])
    
    for model in ["booking_logs", "hotel_booking_guests"]:
        op.add_column(model, sa.Column('email', sa.String, nullable=True))
        op.add_column(model, sa.Column('mobile', sa.String, nullable=True))
        op.add_column(model, sa.Column('name', sa.String, nullable=True))    
        op.alter_column(model, 'guest_id',
                    existing_type=sa.String,  # Ensure the correct type is specified
                    nullable=True)
        
        op.execute(f"""
        UPDATE {model}
        SET
            name = g.name,
            email = g.email,
            mobile = REPLACE(g.mobile, ' ', '')
        FROM guests g
        WHERE {model}.guest_id = g.id;
        """)
    op.execute("""
    UPDATE waypoints
    SET booking_log_id = bl.id
    FROM booking_logs bl
    WHERE waypoints.guest_id = bl.guest_id AND waypoints.booking_id = bl.booking_id;
    """)
    # Execute the SQL query to perform the update

def downgrade():
    # You can define the downgrade logic here if needed
    op.alter_column('booking_logs', 'guest_id',
                    existing_type=sa.String,  # Ensure the correct type is specified
                    nullable=False) 

    op.drop_constraint('waypoint_booking_log_id_fkey', 'waypoints', type_='foreignkey')
    op.drop_column('waypoints', 'booking_log_id')
    op.alter_column('waypoints', 'guest_id',
                    existing_type=sa.BigInteger,  # Ensure the correct type is specified
                    nullable=False) 
    op.alter_column('waypoints', 'booking_id',
                    existing_type=sa.String,  # Ensure the correct type is specified
                    nullable=False)
    for model in ["booking_logs", "hotel_booking_guests"]:
        op.drop_column(model, 'email')
        op.drop_column(model, 'mobile')
        op.drop_column(model, 'name')
    # ### end Alembic commands ###