
from functools import wraps
from unittest.mock import MagicMock


def mock_transactional(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def mock_email_exists_or_raise(model):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

def mock_verify_jwt_role_and_email(allowed_roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator


def mock_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def mock_decorator_with_param(model):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

def get_package():
    return MagicMock(id=1, name_="5hrs 50kms", distance_kms=50, interval_hrs=5, description="This is 5hrs 50kms")
    
def get_vehicle():
    return MagicMock(id=1, name_="Maruti Etios", model="SUV")

def get_organizer():
    return MagicMock(id=1, name_="Admin", role=1, email="admin@gmail.com", is_active=True, is_verified=True)

def get_vendor():
    return MagicMock(id=1, name_="Vendor", email="vendor@gmail.com", primary_mobile="+911234567890", secondary_mobile="+911234589120", address="XYZ", coordinates="13.110, 80.281", tax=9.0)

def get_plan():
    return MagicMock(id=1, package=get_package(), vehicle=get_vehicle(), vendor=get_vendor(), vendor_cost=2000, extra_distance_cost=100, extra_hour_cost=100)