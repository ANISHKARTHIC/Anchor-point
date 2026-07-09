## About
    The constants and configs which are used in our app needed to placed here as config files.

## Logger config keys defined:
    1. **formatters**: We can set the necessary log format as per our need in this key.
    2. **handlers**: Handler configuration as needed for our logger are set here.
    3. **loggers**: The logger we want our script to use, here 'root' defines default logger, we can use the name of our file to tweak logger as per our need
        eg:
         <file_path_where_custom_logger_used>: {
             "level": <as per environment>,
             "handlers": [<handler we want to use>],
             "qualname": <file_path_where_custom_logger_used>,
             "propagate": <True or False>,
         }
        file_path_format: folder1.folder2.file

## Setting Log level:
    1. The log levels we need can be set as environment variables.

## Currently available log formats:
    **1**
    sample log:
    TIME:2023-09-13 06:52:09,676 - module:app - loglevel:INFO - logger:app - function:root() - line_no:21   - message:Inisde hello world
    **2**
    sample log:
    TIME:2023-09-13 07:35:19,106 - module:app - loglevel:CRITICAL - logger:app - function:root() - message:Inisde hello world - call_trace:/app/src/app.py - line_no:24