from logger import logger
from fastapi import Request
import string
import random
import time


async def timing_middleware(request: Request, call_next):
    logger.info("Timing middleware started...")
    idem = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    logger.debug(f"response id={idem} start request path={request.url.path}")
    start_time = time.time()
    response = await call_next(request)
    end_time = time.time()
    elapsed_time = (end_time - start_time) * 1000
    formatted_process_time = "{0:.2f}".format(elapsed_time)
    logger.debug(
        f"response id={idem} completed_in={formatted_process_time}ms status_code={response.status_code}"
    )
    response.headers["X-Elapsed-Time"] = str(formatted_process_time) + "ms"
    logger.info("Timing middleware ended...")
    return response
