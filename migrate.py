
import sqlite3

connection = sqlite3.connect("tasks.db")
cursor = connection.cursor()

# Check existing database columns
cursor.execute("PRAGMA table_info(tasks)")
columns = [column[1] for column in cursor.fetchall()]

# Add priority only if it doesn't already exist
if "priority" not in columns:
    cursor.execute("""
        ALTER TABLE tasks
        ADD COLUMN priority TEXT NOT NULL DEFAULT 'Medium'
    """)
    connection.commit()
    print("Priority column added successfully!")
else:
    print("Priority column already exists.")

connection.close()
