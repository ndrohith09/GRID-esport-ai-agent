# db.py
import sqlite3
from flask import g

def make_connection():
    conn = sqlite3.connect('valorant_esports.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_db():
    if 'db' not in g:
        g.db = make_connection()
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()