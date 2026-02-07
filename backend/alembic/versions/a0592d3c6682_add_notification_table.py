
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a0592d3c6682'
down_revision: Union[str, None] = '268a031ed599'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('notifications',
    sa.Column('id', sa.UUID(), nullable=False, default=sa.text('gen_random_uuid()')),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('type', sa.VARCHAR(length=50), nullable=False),
    sa.Column('title', sa.VARCHAR(length=255), nullable=False),
    sa.Column('message', sa.TEXT(), nullable=False),
    sa.Column('race_id', sa.UUID(), nullable=True),
    sa.Column('horse_id', sa.UUID(), nullable=True),
    sa.Column('amount_sol', sa.DOUBLE_PRECISION(precision=53), nullable=True),
    sa.Column('transaction_signature', sa.VARCHAR(length=255), nullable=True),
    sa.Column('is_read', sa.BOOLEAN(), nullable=False, server_default='false'),
    sa.Column('created_at', postgresql.TIMESTAMP(), nullable=False, server_default=sa.text('now()')),
    sa.Column('read_at', postgresql.TIMESTAMP(), nullable=True),
    sa.ForeignKeyConstraint(['horse_id'], ['horses.id'], name='notifications_horse_id_fkey', ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['race_id'], ['races.id'], name='notifications_race_id_fkey', ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='notifications_user_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name='notifications_pkey')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notifications_is_read', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
