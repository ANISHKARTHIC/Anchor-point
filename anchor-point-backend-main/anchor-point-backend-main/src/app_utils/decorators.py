from functools import wraps
from app_models.database import SessionMaker
from app_models.models import Coordinator, Organizer, Vendor
from common_utils import utils as cutils
from app_utils import exception as ex
from app_models import crud
from logger import logger
from app_models.database import db_session_context


def transactional(func):
    @wraps(func)
    def wrap_func(*args, **kwargs):
        db_session = db_session_context.get()

        if db_session is None:
            db_session = SessionMaker()
            db_session_context.set(db_session)
            try:
                result = func(*args, **kwargs)
                db_session.commit()
            except Exception as err:
                logger.error(err, exc_info=True)
                db_session.rollback()
                raise
            finally:
                db_session.close()
                db_session_context.set(None)

        else:
            return func(*args, **kwargs)
        return result

    return wrap_func



def verify_jwt_role_and_email(allowed_roles):
    def decorator(func):
        def wrapper(email, role, *args, **kwargs):
            if isinstance(email, (Organizer, Coordinator, Vendor)):
                return func(email, *args, **kwargs)
            if role not in allowed_roles:
                raise ex.InvalidRole
            model = {
                "coordinator": Coordinator,
                "organizer": Organizer,
                "vendor": Vendor,
            }.get(role)
            record = crud.select_records( 
                primary_table=model, filter_conditions=[model.email == email]
            ).first()
            if not record:
                raise ex.EmailNotFound
            return func(record, *args, **kwargs)
        return wrapper
    return decorator

def email_exists_or_raise(model):
    """
    A decorator function to check if an email exists in a database table and raise an exception if not found.
    Args:
        model (SQLAlchemy model): The SQLAlchemy model representing the database table to query.
    Returns:
        function: A decorated function that checks for the existence of the email in the database.
    Raises:
        ex.EmailNotFound: If the email is not found in the database.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(email, *args, **kwargs):
            if isinstance(email, (Organizer, Coordinator, Vendor)):
                return func(email, *args, **kwargs)
            result = crud.select_records(
                primary_table=model, filter_conditions=[model.email == email]
            ).first()
            if result:
                return func(result, *args, **kwargs)
            raise ex.EmailNotFound
        return wrapper

    return decorator

def authentic_user(model):
    def decorator(func):
        @wraps(func)
        def wrapper(email, password, *args, **kwargs):
            result = crud.select_records(
                primary_table=model, filter_conditions=[model.email == email, model.is_active == True]
            ).first()
            if result and cutils.verify_password(password=password, hashed_pass=result.password):
                return func(result, *args, **kwargs)
            raise ex.InvalidUserNameOrPassword  
        return wrapper

    return decorator