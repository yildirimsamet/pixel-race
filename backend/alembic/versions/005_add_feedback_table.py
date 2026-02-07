
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '005_add_feedback'
down_revision: Union[str, None] = '004_add_is_admin'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    feedback_type_enum = postgresql.ENUM(
        'SUGGESTION', 'BUG_REPORT', 'COMPLAINT', 'QUESTION', 'OTHER',
        name='feedbacktype',
        create_type=True
    )
    feedback_type_enum.create(op.get_bind(), checkfirst=True)

    feedback_status_enum = postgresql.ENUM(
        'NEW', 'REVIEWED', 'RESOLVED', 'CLOSED',
        name='feedbackstatus',
        create_type=True
    )
    feedback_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'feedbacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('type', sa.Enum('SUGGESTION', 'BUG_REPORT', 'COMPLAINT', 'QUESTION', 'OTHER', name='feedbacktype'), nullable=False),
        sa.Column('subject', sa.String(200), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('status', sa.Enum('NEW', 'REVIEWED', 'RESOLVED', 'CLOSED', name='feedbackstatus'), server_default='NEW', nullable=False),
        sa.Column('admin_notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    op.create_index('ix_feedbacks_type_status_created', 'feedbacks', ['type', 'status', 'created_at'])
    op.create_index('ix_feedbacks_status', 'feedbacks', ['status'])
    op.create_index('ix_feedbacks_created_at', 'feedbacks', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_feedbacks_created_at', table_name='feedbacks')
    op.drop_index('ix_feedbacks_status', table_name='feedbacks')
    op.drop_index('ix_feedbacks_type_status_created', table_name='feedbacks')

    op.drop_table('feedbacks')

    feedback_status_enum = postgresql.ENUM(
        'NEW', 'REVIEWED', 'RESOLVED', 'CLOSED',
        name='feedbackstatus'
    )
    feedback_status_enum.drop(op.get_bind(), checkfirst=True)

    feedback_type_enum = postgresql.ENUM(
        'SUGGESTION', 'BUG_REPORT', 'COMPLAINT', 'QUESTION', 'OTHER',
        name='feedbacktype'
    )
    feedback_type_enum.drop(op.get_bind(), checkfirst=True)
