
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '268a031ed599'
down_revision: Union[str, None] = '002_goodluck_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('horse_stats', 'speed_score')


def downgrade() -> None:
    op.add_column('horse_stats', sa.Column('speed_score', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=False, server_default='50.0'))
