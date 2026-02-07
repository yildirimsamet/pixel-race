
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '006_add_chat_messages'
down_revision: Union[str, None] = 'token_info_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('race_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('races.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
    )

    op.create_index('ix_chat_messages_race_created', 'chat_messages', ['race_id', 'created_at'])

    op.create_index('ix_chat_messages_user_id', 'chat_messages', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_chat_messages_user_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_race_created', table_name='chat_messages')

    op.drop_table('chat_messages')
