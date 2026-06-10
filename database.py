import psycopg2
from psycopg2.extras import RealDictCursor

# Masukkan Connection String dari Neon.tech di bawah ini
DB_URL = "postgresql://neondb_owner:npg_ktqXBZI6WUC5@ep-winter-tree-aoskx5vh-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_connection():
    try:
        conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise e