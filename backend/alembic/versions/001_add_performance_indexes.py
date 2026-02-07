
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001_perf_indexes'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('idx_races_status', 'races', ['status'], unique=False)
    op.create_index('idx_races_start_time_status', 'races', ['start_time', 'status'], unique=False)

    op.create_index('idx_horses_user_id', 'horses', ['user_id'], unique=False)
    op.create_index('idx_horses_in_race', 'horses', ['in_race'], unique=False)

    op.create_index('idx_race_results_race_id', 'race_results', ['race_id'], unique=False)
    op.create_index('idx_race_results_horse_id', 'race_results', ['horse_id'], unique=False)
    op.create_index('idx_race_results_race_horse', 'race_results', ['race_id', 'horse_id'], unique=False)

    op.create_index('idx_horse_stats_horse_id', 'horse_stats', ['horse_id'], unique=False)

    op.create_index('idx_users_wallet_address', 'users', ['wallet_address'], unique=True)


def downgrade() -> None:
    op.drop_index('idx_users_wallet_address', table_name='users')

    op.drop_index('idx_horse_stats_horse_id', table_name='horse_stats')

    op.drop_index('idx_race_results_race_horse', table_name='race_results')
    op.drop_index('idx_race_results_horse_id', table_name='race_results')
    op.drop_index('idx_race_results_race_id', table_name='race_results')

    op.drop_index('idx_horses_in_race', table_name='horses')
    op.drop_index('idx_horses_user_id', table_name='horses')

    op.drop_index('idx_races_start_time_status', table_name='races')
    op.drop_index('idx_races_status', table_name='races')
