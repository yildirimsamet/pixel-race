
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = 'token_info_001'
down_revision = '4c41578bb8a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'token_info',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('token_name', sa.String(100), nullable=False, server_default='Pixel Race Token'),
        sa.Column('contract_address', sa.String(255), nullable=False),
        sa.Column('token_url', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('token_info')
