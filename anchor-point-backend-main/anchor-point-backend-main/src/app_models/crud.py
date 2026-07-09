"""
This file contains the methods to perform crud operations for our defined app_models
"""
from functools import wraps
from sqlalchemy import and_, update, delete, text, Sequence, func
from sqlalchemy.orm import Session, Query
from app_models.models import Base
from app_models.database import db_session_context


def db(func):
    @wraps(func)
    def wrap_func(*args, **kwargs):
        db_session = db_session_context.get()
        return func(db_session, *args, **kwargs)

    return wrap_func

@db
def insert_record(db, model, **kwargs):
    """
    Insert a new record into the database.
    Args:
        db (Session): The SQLAlchemy database db.
        model (Base): The SQLAlchemy model to which the record will be added.
        **kwargs: Keyword arguments representing the data for the new record.
    Returns:
        Base: The newly inserted record.
    """
    new_record = model(**kwargs)
    db.add(new_record)
    db.flush()
    return new_record


@db
def insert_records(db, model, records):
    """
    Insert multiple records into the database.
    Args:
        db (Session): The SQLAlchemy database session.
        model (Base): The SQLAlchemy model to which the records will be added.
        records (list of dict): A list of dictionaries, each representing the data for a new record.
    Returns:
        list of Base: The newly inserted records.
    """
    new_records = [model(**record) for record in records]
    db.add_all(new_records)
    db.flush()
    return new_records


@db
def update_records(
    db: Session, model: Base, filter_criteria: tuple, records_to_update: dict
):
    """
    Update records in the database that match the given filter criteria with the specified values.
    Args:
        db (Session): The SQLAlchemy database db.
        model (Base): The SQLAlchemy model to be updated.
        filter_criteria (dict): Filter criteria for selecting records to update.
        records_to_update (dict): The dict contaning records to update.
    """
    stmt = update(model).where(and_(*filter_criteria)).values(**records_to_update)
    return db.execute(stmt)


@db
def delete_record(db: Session, model: Base, filter_criteria: tuple):
    """
    Delete record from the database that match the given filter criteria.
    Args:
        db (Session): The SQLAlchemy database db.
        model (Base): The SQLAlchemy model from which records will be deleted.
        filter_criteria (dict): Filter criteria for selecting records to delete.
    """
    stmt = delete(model).where(and_(*filter_criteria))
    return db.execute(stmt)
    

@db
def select_records(
    db: Session,
    primary_table,
    select_cols=None,
    join_conditions=None,
    filter_conditions=None,
    order_by=None,
    group_by=None,
    having=None,
    offset=None,
    limit=None,
):
    """
    Constructs a SQL query for selecting data from one or more tables, based on the given parameters.

    Parameters:
    db (SQLAlchemy Session): The database db to use.
    primary_table (SQLAlchemy Table): The main table to select from.
    select_cols (list of str, optional): A list of column names to select. If not provided, all columns will be selected.
    join_conditions (list of tuples, optional): A list of tuples (table, condition) representing join clauses to apply to the query. If not provided, no joins will be performed.
    filter_conditions (list of SQLAlchemy expressions, optional): A list of SQLAlchemy expressions to filter the query. If not provided, no filters will be applied.
    order_by (list of str, optional): A list of column names to use for sorting the query results. If not provided, no sorting will be applied.
    offset (int): The starting point for the operation.
    limit (int): The maximum number of items to process or retrieve.
    Returns:
    SQLAlchemy Query: The constructed query object.
    """
    # create the initial query with the primary table
    query = Query(session=db, entities=primary_table)

    # add the select columns to the query
    if select_cols:
        query = query.with_entities(*select_cols)

    # add the join conditions to the query
    if join_conditions:
        query = query.select_from(primary_table)
        for join_condition in join_conditions:
            if len(join_condition) == 2:
                target_table, condition = join_condition
                query = query.join(target_table, condition)
            elif len(join_condition) == 3:
                target_table, condition, join_type = join_condition
                if join_type == 'left':
                    query = query.outerjoin(target_table, condition)

    # add the filter conditions to the query
    if filter_conditions:
        query = query.filter(*filter_conditions)

    # add the order by clause to the query
    if order_by:
        query = query.order_by(*order_by)

    if group_by:
        query = query.group_by(*group_by)

    if having:
        query = query.having(*having)

    if offset:
        query = query.offset(offset)

    if limit:
        query = query.limit(limit)

    return query


@db
def fetch_seq_value(db: Session, seq_obj: Sequence):
    return db.execute(func.next_value(seq_obj)).scalar()

@db
def set_seq_value(db: Session, seq_name: str , reset_value: int):
    return db.execute(func.setval(seq_name, reset_value, False))