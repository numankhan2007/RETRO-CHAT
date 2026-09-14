import psycopg2
import sys

regions = [
    "ap-south-1", "eu-central-1", "us-east-1", "us-west-1", "ap-southeast-1", "eu-west-1", "eu-west-2", "sa-east-1"
]

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    print(f"Trying {host}...")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres.lkyipuuxpzqscvdzraef",
            password="Retro_chat@2026",
            host=host,
            port=6543,
            connect_timeout=3
        )
        print(f"SUCCESS: {host}")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"Failed: {e}")
