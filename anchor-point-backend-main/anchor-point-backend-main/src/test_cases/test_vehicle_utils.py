"""
This file contains all the unit test cases for all functions in vehicle utils module
"""
import unittest
import os 
import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from unittest.mock import patch, MagicMock
from helper import mock_email_exists_or_raise, mock_transactional
patch("app_utils.decorators.transactional" , mock_transactional).start()
patch("app_utils.decorators.email_exists_or_raise", mock_email_exists_or_raise).start()
    
from app_models.models import Vehicle
from app_routes.vehicle.schema import VehicleInfo
from app_routes.vehicle import utils as vehicle_utils
from app_utils import exception as ex
from sqlalchemy import exc

class TestVehicle(unittest.TestCase):

    def setUp(self):
        self.organizer = MagicMock(name="organizer")
        self.vehicle_info = VehicleInfo(name="Etios", vehicle_model_id=1)
        self.vehicle = {"id":1, "name": "Etios", "vehicle_model_id":1}

    @patch("app_models.crud.insert_record")
    def test_create_vehicle_success(self, mock_insert_record):
        # Arrange
        mock_insert_record.return_value = MagicMock(id=1)
        # Act
        result = vehicle_utils.create_vehicle(self.organizer, self.vehicle_info)
        # Assert
        self.assertEqual(result["vehicle_id"], 1)
        self.assertEqual(result["message"], "Successfully created new vehicle")
        mock_insert_record.assert_called_once_with(Vehicle, name = self.vehicle_info.name, vehicle_model_id=self.vehicle_info.vehicle_model_id)
    
    @patch("app_models.crud.insert_record")
    def test_create_vehicle_on_integrity_exception(self, mock_insert_record):
        # Arrange
        mock_insert_record.side_effect = exc.IntegrityError("Failed to insert record", params={}, orig=None)
        # Assert
        with self.assertRaises(ex.RecordExists):
            # Act
            vehicle_utils.create_vehicle(self.organizer, self.vehicle_info)
        mock_insert_record.assert_called_once_with(Vehicle, name = self.vehicle_info.name, vehicle_model_id=self.vehicle_info.vehicle_model_id)
    
    @patch("app_models.crud.insert_record")
    def test_create_vehicle_on_db_operation_exception(self, mock_insert_record):
        # Arrange
        mock_insert_record.return_value = None
        # Assert
        with self.assertRaises(ex.DatabaseOperationFailed):
            # Act
            vehicle_utils.create_vehicle(self.organizer, self.vehicle_info)
        mock_insert_record.assert_called_once_with(Vehicle, name = self.vehicle_info.name, vehicle_model_id=self.vehicle_info.vehicle_model_id)
    
    @patch("app_models.crud.select_records")
    def test_get_vehicle_by_id_success(self, mock_select_records):
        # Arrange
        vehicle_id = 1
        mock_select_records.return_value.first.return_value = MagicMock(vehicle_json=self.vehicle)
        # Act
        result = vehicle_utils.get_vehicle_by_id(self.organizer, vehicle_id)
        # Assert
        self.assertDictEqual(result["vehicle"], self.vehicle)
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicle_by_id_on_exception(self, mock_select_records):
        # Arrange
        vehicle_id = 1
        mock_select_records.return_value.first.return_value = None
        # Assert
        with self.assertRaises(ex.RecordNotFound):
            # Act
            vehicle_utils.get_vehicle_by_id(self.organizer, vehicle_id)
        mock_select_records.assert_called()
    
    @patch("app_models.crud.select_records")
    def test_get_vehicles_success(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.all.return_value = [(self.vehicle,)]
        # Act
        result = vehicle_utils.get_vehicles(self.organizer)
        # Assert
        self.assertEqual(result["vehicles"], [self.vehicle] )
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicles_on_exception(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.all.return_value = None
        # Assert
        with self.assertRaises(ex.RecordNotFound):
            # Act
            vehicle_utils.get_vehicles(self.organizer)
        mock_select_records.assert_called()

    @patch("app_routes.vehicle.utils.get_vehicle_by_id")    
    @patch("app_models.crud.update_records")
    def test_update_vehicle_success(self, mock_update_records, mock_get_vehicle_by_id):
        # Arrange
        vehicle_id = 1
        mock_update_records.return_value = MagicMock(rowcount=1)
        # Act
        result = vehicle_utils.update_vehicle(self.organizer, vehicle_id, self.vehicle_info)
        # Assert
        self.assertEqual(result["vehicle_id"], 1)
        self.assertEqual(result["message"], "Successfully updated vehicle")
        mock_update_records.assert_called()

    @patch("app_routes.vehicle.utils.get_vehicle_by_id")    
    @patch("app_models.crud.update_records")
    def test_update_vehicle_on_db_operation_exception(self, mock_update_records, mock_get_vehicle_by_id):
        # Arrange
        vehicle_id = 1
        mock_update_records.return_value = MagicMock(rowcount=0)
        with self.assertRaises(ex.DatabaseOperationFailed):
            # Act
            vehicle_utils.update_vehicle(self.organizer, vehicle_id, self.vehicle_info)
        mock_update_records.assert_called()

    @patch("app_routes.vehicle.utils.get_vehicle_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_success(self, mock_delete_record, mock_get_vehicle_by_id):
        # Arrange
        vehicle_id = 1
        mock_delete_record.return_value = MagicMock(rowcount=1)
        # Act
        result = vehicle_utils.delete_vehicle(self.organizer, vehicle_id)
        # Assert
        self.assertEqual(result["vehicle_id"], vehicle_id)
        self.assertEqual(result["message"], "Successfully deleted vehicle")
        mock_delete_record.assert_called()
    
    @patch("app_routes.vehicle.utils.get_vehicle_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_on_integrity_exception(self, mock_delete_record, mock_get_vehicle_by_id):
        # Arrange
        vehicle_id = 1
        mock_delete_record.side_effect = exc.IntegrityError("foreign key violation", params={}, orig=None)
        with self.assertRaises(ex.ForeginKeyViolation):
            # Act
            vehicle_utils.delete_vehicle(self.organizer, vehicle_id)
    
    @patch("app_routes.vehicle.utils.get_vehicle_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_on_db_operation_exception(self, mock_delete_record, mock_get_vehicle_by_id):
        # Arrange
        vehicle_id = 1
        mock_delete_record.return_value = MagicMock(rowcount=0)
        with self.assertRaises(ex.DatabaseOperationFailed):
            # Act
            vehicle_utils.delete_vehicle(self.organizer, vehicle_id)
        mock_delete_record.assert_called()