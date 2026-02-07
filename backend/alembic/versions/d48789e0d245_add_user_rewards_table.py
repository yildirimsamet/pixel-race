
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd48789e0d245'
down_revision: Union[str, None] = 'a0592d3c6682'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_rewards',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reward_type', sa.String(), nullable=False),
        sa.Column('claimed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('claimed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'reward_type', name='uq_user_reward_type')
    )
    op.create_index('ix_user_rewards_user_id', 'user_rewards', ['user_id'], unique=False)
    op.create_index('ix_user_rewards_reward_type', 'user_rewards', ['reward_type'], unique=False)
    op.create_index('ix_user_rewards_claimed', 'user_rewards', ['claimed'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_rewards_claimed', table_name='user_rewards')
    op.drop_index('ix_user_rewards_reward_type', table_name='user_rewards')
    op.drop_index('ix_user_rewards_user_id', table_name='user_rewards')
    op.drop_table('user_rewards')
