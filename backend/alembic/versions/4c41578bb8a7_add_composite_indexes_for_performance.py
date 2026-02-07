
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4c41578bb8a7'
down_revision: Union[str, None] = '005_add_feedback'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ix_races_status_start_time',
        'races',
        ['status', 'start_time'],
        unique=False
    )

    op.create_index(
        'ix_horses_user_id_in_race',
        'horses',
        ['user_id', 'in_race'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_horses_user_id_in_race', table_name='horses')
    op.drop_index('ix_races_status_start_time', table_name='races')
