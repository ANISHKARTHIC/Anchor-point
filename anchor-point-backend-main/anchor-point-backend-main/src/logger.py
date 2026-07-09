from logging import config, getLogger
from app_configs.logger_config import config_dict


logger = getLogger(__name__)
config.dictConfig(config_dict)
