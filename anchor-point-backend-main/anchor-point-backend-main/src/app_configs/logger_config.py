from app_configs.configs import configs as cfg

config_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "1": {
            "format": "TIME:%(asctime)s - module:%(module)s - loglevel:%(levelname)s - logger:%(name)s - function:%(funcName)s() - line_no:%(lineno)-4d - message:%(message)s",
        },
        "2": {
            "format": "TIME:%(asctime)s - module:%(module)s - loglevel:%(levelname)s - logger:%(name)s - function:%(funcName)s() - message:%(message)s - call_trace:%(pathname)s - line_no:%(lineno)d",
        },
    },
    "handlers": {
        "detailedConsoleHandler": {
            "class": "logging.StreamHandler",
            "level": cfg.LOG_LEVEL,
            "formatter": cfg.LOG_FORMAT,
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "root": {
            "level": cfg.LOG_LEVEL,
            "handlers": ["detailedConsoleHandler"],
        }
    },
}
