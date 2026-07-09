"""
This file has the code to create a connection with DB
"""
import contextvars
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app_configs.configs import db_config

conn_string = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['name']}"
db_engine = create_engine(conn_string, pool_size=20, max_overflow=10)
db_session_context = contextvars.ContextVar("db_session", default=None)
SessionMaker = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
Base = declarative_base()
