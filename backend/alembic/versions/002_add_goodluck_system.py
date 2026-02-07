
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002_goodluck_system'
down_revision: Union[str, None] = '001_perf_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('goodluck_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('race_results', sa.Column('goodluck_used', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('race_results', 'goodluck_used')
    op.drop_column('users', 'goodluck_count')
