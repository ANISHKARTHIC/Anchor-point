"""
This file contains all the unit test cases for all functions in plan utils module
"""
import unittest
import os 
import sys
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import helper
patch("app_utils.decorators.transactional" , helper.mock_decorator).start()
patch("app_utils.decorators.email_exists_or_raise", helper.mock_decorator_with_param).start()
patch("app_utils.decorators.verify_jwt_role_and_email", helper.mock_verify_jwt_role_and_email).start()
patch("app_routes.organizer.utils.super_organizer_only", helper.mock_decorator).start()

from app_models.models import Plan
from app_routes.plan import utils as plan_utils
from app_utils import exception as ex
from app_routes.plan.schema import PlanInfo

class TestPlan(unittest.TestCase):
    def setUp(self) -> None:
        self.plan_request = PlanInfo(package_id=1, vehicle_id=1, vendor_id=1, cost=2000, extra_distance_cost=100, extra_hour_cost=100)
        self.package = helper.get_package()
        self.vehicle = helper.get_vehicle()
        self.vendor = helper.get_vendor()
        self.organizer = helper.get_organizer()
        self.plan = helper.get_plan()
        self.vendor_id = 1
        self.plan_id = 2
        self.cab_type = "SUV"

    @patch("app_models.crud.select_records")
    def test_get_plans(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.all.return_value = [self.plan]
        # Act
        for vendor_id in [None, self.vendor_id]:
            with self.subTest(vendor_id=vendor_id):
                result = plan_utils.get_plans(self.organizer, vendor_id)
                # Assert
                self.assertIsInstance(result, dict)     
                self.assertIsInstance(result["plans"], list)   

    @patch("app_models.crud.select_records")
    def test_get_plans_exception(self, mock_select_records):
        # Arrange
        mock_select_records.return_value.all.return_value = None
        # Act
        with self.assertRaises(ex.RecordNotFound):
            plan_utils.get_plans(self.organizer, self.vendor_id)
        # Assert
        mock_select_records.assert_called()

    @patch("app_utils.utils.get_model_record_by_id")
    def test_get_plan_by_id(self, mock_get_model_record_by_id):
        # Arrange
        mock_get_model_record_by_id.return_value = self.plan
        # Act
        result = plan_utils.get_plan_by_id(self.organizer, self.plan_id)
        # Assert
        self.assertIsInstance(result, dict)
        mock_get_model_record_by_id.assert_called_once_with(Plan, self.plan_id)

    @patch("app_models.crud.select_records")
    def test_get_plan_data_by_filters(self, mock_select_records):
        # Arrange
        filter_criteria = {"package_id": 1, "vehicle_id": 2}
        mock_select_records.return_value.first.return_value = self.plan
        # Act
        result = plan_utils.get_plan_data_by_filters(**filter_criteria)
        # Assert
        self.assertEqual(result, self.plan)     
        mock_select_records.assert_called()
    
    @patch("app_utils.utils.get_model_record_by_id")
    @patch("app_models.crud.delete_record")
    def test_delete_plan(self, mock_delete_record, mock_get_model_record_by_id):
        # Arrange
        mock_get_model_record_by_id.return_value = self.plan
        mock_delete_record.return_value = MagicMock(rowcount=1)
        # Act 
        result = plan_utils.delete_plan(self.organizer, self.plan_id)
        # Assert
        self.assertDictEqual(result, {"plan_id":self.plan_id , "message": "Successfully deleted plan"})
        mock_get_model_record_by_id.assert_called_once_with(Plan, self.plan_id)

    
    @patch("app_utils.utils.get_model_record_by_id")
    @patch("app_models.crud.delete_record")
    def test_delete_plan_exception(self, mock_delete_record, mock_get_model_record_by_id):
       # Arrange
        mock_delete_record.return_value = MagicMock(rowcount=0)
        # Act
        with self.assertRaises(ex.DatabaseOperationFailed):
            plan_utils.delete_plan(self.organizer, self.plan_id)
        # Assert
        mock_delete_record.assert_called()
        mock_get_model_record_by_id.assert_called_once_with(Plan, self.plan_id)
     
    @patch("app_routes.plan.utils.get_plan_data_by_filters")
    @patch("app_models.crud.insert_record")
    def test_create_plan(self, mock_insert_record, mock_get_plan_data_by_filters):
        # Arrange
        mock_get_plan_data_by_filters.return_value = None
        mock_insert_record.return_value = self.plan
        # Act
        result = plan_utils.create_plan(self.organizer, self.plan_request)
        # Assert
        self.assertDictEqual(result, {"plan_id":1, "message": f"Successfully created new plan for the vendor"})
        mock_insert_record.assert_called()
        mock_get_plan_data_by_filters.assert_called()

    @patch("app_routes.plan.utils.get_plan_data_by_filters")
    def test_create_plan_exists_exception(self, mock_get_plan_data_by_filters):
        # Arrange
        mock_get_plan_data_by_filters.return_value = self.plan
        # Act
        with self.assertRaises(ex.PlanExists):
            plan_utils.create_plan(self.organizer, self.plan_request)
        # Assert
        mock_get_plan_data_by_filters.assert_called()  
    

    @patch("app_routes.plan.utils.get_plan_data_by_filters")
    @patch("app_models.crud.insert_record")
    def test_create_plan_database_exception(self, mock_insert_record, mock_get_plan_data_by_filters):
        # Arrange
        mock_get_plan_data_by_filters.return_value = None
        mock_insert_record.return_value = None
        # Act
        with self.assertRaises(ex.DatabaseOperationFailed):
            plan_utils.create_plan(self.organizer, self.plan_request)
        # Assert
        mock_insert_record.assert_called()
        mock_get_plan_data_by_filters.assert_called()
    
    @patch("app_utils.utils.get_model_record_by_id")
    @patch("app_models.crud.update_records")
    def test_update_plan(self, mock_update_records, mock_get_model_record_by_id):
        # Arrange
        mock_get_model_record_by_id.return_value = self.plan
        mock_update_records.return_value = MagicMock(rowcount=1)
        # Act
        result = plan_utils.update_plan(self.organizer, self.plan_id, self.plan_request)
        # Assert
        self.assertDictEqual(result, {"plan_id": self.plan_id, "message": "Successfully updated plan details"})
        mock_get_model_record_by_id.assert_called_once_with(Plan, self.plan_id)
        mock_update_records.assert_called()
    
    @patch("app_utils.utils.get_model_record_by_id")
    @patch("app_models.crud.update_records")
    def test_update_plan_database_exception(self, mock_update_records, mock_get_model_record_by_id):
        # Arrange
        mock_get_model_record_by_id.return_value = self.plan
        mock_update_records.return_value = MagicMock(rowcount=0)
        # Act
        with self.assertRaises(ex.DatabaseOperationFailed):
            plan_utils.update_plan(self.organizer, self.plan_id, self.plan_request)
        # Assert
        mock_get_model_record_by_id.assert_called_once_with(Plan, self.plan_id)
        mock_update_records.assert_called()

    @patch("app_models.crud.select_records")
    def test_get_plan_vendors(self, mock_select_records):
        pass