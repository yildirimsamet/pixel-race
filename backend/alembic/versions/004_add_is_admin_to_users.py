
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '004_add_is_admin'
down_revision: Union[str, None] = '003_race_horse_unique'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))

    op.create_index('ix_users_is_admin', 'users', ['is_admin'], unique=False)



def downgrade() -> None:
    op.drop_index('ix_users_is_admin', table_name='users')

    op.drop_column('users', 'is_admin')
