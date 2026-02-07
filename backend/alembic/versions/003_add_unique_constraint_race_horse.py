
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '003_race_horse_unique'
down_revision: Union[str, None] = 'd48789e0d245'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'uq_race_horse',
        'race_results',
        ['race_id', 'horse_id'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index('uq_race_horse', table_name='race_results')
