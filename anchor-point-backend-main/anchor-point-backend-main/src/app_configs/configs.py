"""
Config file to be used by Application
config file will be loaded based on environment's
"""
import importlib
import os

db_config = {
    "host": os.environ.get("DB_HOST"),
    "port": int(os.environ.get("DB_PORT")),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
    "name": os.environ.get("DB_NAME"),
}
env = os.environ.get("ENV", "dev").lower()
configs = importlib.import_module(f"app_configs.{env}_configs", package=None)
