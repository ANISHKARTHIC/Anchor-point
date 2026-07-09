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

from app_models.models import VehicleModel
from app_routes.vehicle import utils as vehicle_utils
from app_utils import exception as ex
from sqlalchemy import exc

class TestVehicleModel(unittest.TestCase):

    def setUp(self):
        self.organizer = MagicMock(name="organizer")
        self.vehicle_model_id = 1
        self.vehicle_model = "SUV"

    @patch("app_models.crud.insert_record")
    def test_create_vehicle_model_success(self, mock_insert_record):
        # Arrange
        mock_insert_record.return_value.id = 1
        # Act
        result = vehicle_utils.create_vehicle_model(self.organizer, self.vehicle_model)
        # Assert
        self.assertEqual(result["vehicle_model_id"], 1)
        self.assertEqual(result["vehicle_model"], self.vehicle_model)
        self.assertEqual(result["message"], "Successfully created new vehicle model")
        mock_insert_record.assert_called_once_with(VehicleModel, vehicle_model=self.vehicle_model)

    @patch("app_models.crud.insert_record")
    def test_create_vehicle_model_on_exception(self, mock_insert_record):
        # Arrange
        mock_insert_record.side_effect = exc.IntegrityError("Failed to insert record", params={}, orig=None)
        # Assert
        with self.assertRaises(ex.RecordExists):
            # Act
            vehicle_utils.create_vehicle_model(self.organizer, self.vehicle_model)
        mock_insert_record.assert_called_once_with(VehicleModel, vehicle_model=self.vehicle_model)

    @patch("app_models.crud.select_records")
    def test_get_vehicle_model_success(self, mock_select_records):
        # Arrange
        vehicle_models = ["SUV", "Sedan", "Hatchback"]
        mock_select_records.return_value.all.return_value = [vehicle_models]
        # Act
        result = vehicle_utils.get_vehicle_models(self.organizer)
        # Assert
        self.assertEqual(result["vehicle_models"], vehicle_models)
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicle_model_by_id_success(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.first.return_value = MagicMock(vehicle_model_json=self.vehicle_model)
        # Act
        result = vehicle_utils.get_vehicle_model_by_id(self.organizer, self.vehicle_model_id)
        # Assert
        self.assertEqual(result["vehicle_model"], self.vehicle_model)
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicle_model_by_id_on_exception(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.first.return_value = None
        # Assert
        with self.assertRaises(ex.RecordNotFound):
            # Act
            vehicle_utils.get_vehicle_model_by_id(self.organizer, self.vehicle_model_id)
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicle_model_by_vehicle_model_success(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.first.return_value = MagicMock(vehicle_model_json=self.vehicle_model)
        # Act
        result = vehicle_utils.get_vehicle_model_by_vehicle_model(self.organizer, self.vehicle_model)
        # Assert
        self.assertEqual(result["vehicle_model"], self.vehicle_model)
        mock_select_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_vehicle_model_by_vehicle_model_on_exception(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.first.return_value = None
        # Assert
        with self.assertRaises(ex.RecordNotFound):
            # Act
            vehicle_utils.get_vehicle_model_by_vehicle_model(self.organizer, self.vehicle_model)
        mock_select_records.assert_called()
    
    @patch("app_routes.vehicle.utils.get_vehicle_model_by_id")    
    @patch("app_models.crud.update_records")
    def test_update_vehicle_model_success(self, mock_update_records, mock_get_vehicle_model_by_id):
        # Arrange
        mock_get_vehicle_model_by_id.return_value = MagicMock(name="vehicle_model")
        mock_update_records.return_value.id = 1
        # Act
        result = vehicle_utils.update_vehicle_model(self.organizer, self.vehicle_model_id, self.vehicle_model)
        # Assert
        self.assertEqual(result["vehicle_model_id"], self.vehicle_model_id)
        self.assertEqual(result["message"], "Successfully updated vehicle model")
        mock_update_records.assert_called()
    
    @patch("app_routes.vehicle.utils.get_vehicle_model_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_model_success(self, mock_delete_record, mock_get_vehicle_model_by_id):
        # Arrange  
        mock_get_vehicle_model_by_id.return_value = MagicMock(name="vehicle_model")
        mock_delete_record.return_value.id = 1
        # Act
        result = vehicle_utils.delete_vehicle_model(self.organizer, self.vehicle_model_id)
        # Assert
        self.assertEqual(result["vehicle_model_id"], self.vehicle_model_id)
        self.assertEqual(result["message"], "Successfully deleted vehicle model")
        mock_delete_record.assert_called()
    
        
    @patch("app_routes.vehicle.utils.get_vehicle_model_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_model_on_integrity_exception(self, mock_delete_record, mock_get_vehicle_model_by_id):
        # Arrange
        mock_delete_record.side_effect = exc.IntegrityError("foreign key violation", params={}, orig=None)
        with self.assertRaises(ex.ForeginKeyViolation):
            # Act
            vehicle_utils.delete_vehicle_model(self.organizer, self.vehicle_model_id)
        mock_delete_record.assert_called()
    
    @patch("app_routes.vehicle.utils.get_vehicle_model_by_id")    
    @patch("app_models.crud.delete_record")
    def test_delete_vehicle_model_on_db_operation_exception(self, mock_delete_record, mock_get_vehicle_model_by_id):
        # Arrange
        mock_delete_record.return_value = MagicMock(rowcount=0)
        with self.assertRaises(ex.DatabaseOperationFailed):
            # Act
            vehicle_utils.delete_vehicle_model(self.organizer, self.vehicle_model_id)
        mock_delete_record.assert_called()
    
    @patch("app_routes.vehicle.utils.get_vehicle_model_by_id")    
    @patch("app_models.crud.update_records")
    def test_update_vehicle_model_on_db_operation_exception(self, mock_update_records, mock_get_vehicle_model_by_id):
        # Arrange
        mock_update_records.return_value = MagicMock(rowcount=0)
        with self.assertRaises(ex.DatabaseOperationFailed):
            # Act
            vehicle_utils.update_vehicle_model(self.organizer, self.vehicle_model_id, self.vehicle_model)
        mock_update_records.assert_called()