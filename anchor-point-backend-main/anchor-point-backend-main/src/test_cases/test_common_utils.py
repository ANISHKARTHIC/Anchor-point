"""
This file contains all the unit test cases for all functions in common_utils module
"""
import unittest
import os 
import sys
import pytz
import jwt
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from unittest import mock
from app_schemas.schema import AccessToken
from common_utils import utils as cutils
from datetime import datetime, timedelta, timezone
from app_utils import exception as ex
from app_configs import constants as const

class TestValidateMobileNumberFormat(unittest.TestCase):
    def test_valid_mobile_number(self):
        number = "+911234567890"
        result = cutils.validate_mobile_number_format(number)
        self.assertEqual(result, number)

    def test_mobile_number_without_country_code(self):
        numbers = [ "1234567890", "123456", "123456789a"]
        
        for number in numbers:
            with self.subTest(number=number):
                with self.assertRaises(ValueError):
                    cutils.validate_mobile_number_format(number)

class TestDomainInList(unittest.TestCase):
    def test_valid_domain_name_for_email(self):
        email = "johndoe@synergyship.com"
        result = cutils.check_domain_in_list(email)
        self.assertTrue(result)

    def test_invalid_domain_name_for_email(self):
        email = "johndoe@yahoo.com"
        result = cutils.check_domain_in_list(email)
        self.assertFalse(result)

class TestConvertToDatetime(unittest.TestCase):
    @mock.patch("common_utils.utils.convert_datetime")
    def test_convert_to_datetime_with_valid_date_time(self, mock_convert_datetime):
        mock_convert_datetime.return_value = datetime.now()
        date = "2024-04-23"
        time = "12:12"
        result = cutils.convert_to_datetime(date, time)
        self.assertIsInstance(result, datetime)
    
    @mock.patch("common_utils.utils.convert_datetime")
    def test_convert_to_datetime_with_invalid_date_time(self, mock_convert_datetime):
        mock_convert_datetime.return_value = datetime.now()
        datetime_inputs = [("", ""),("23-03-2023", "12:12")] 
        
        for date, time in datetime_inputs:
            with self.subTest(date=date, time=time):
                with self.assertRaises(ex.InvalidDateTimeFormat):
                    cutils.convert_to_datetime(date, time)

class TestDateTime(unittest.TestCase):
    def setUp(self):
        self.date_string = "2024-02-21 10:30:00"
        self.datetime_obj = datetime.strptime(self.date_string, '%Y-%m-%d %H:%M:%S')
        self.datetime_utc = self.datetime_obj.astimezone(pytz.UTC)
        self.datetime_local = self.datetime_obj.astimezone(pytz.timezone(const.TARGET_TZ))


    def test_get_pickup_time(self):
        expeced_result = "04:00 PM"
        result = cutils.get_pickup_time(utc_time=self.datetime_utc)
        self.assertIsInstance(result, str)
        self.assertEqual(result, expeced_result)

    def test_get_pickup_date(self):
        expeced_result = "21-02-2024"
        result = cutils.get_pickup_date(utc_time=self.datetime_utc)  
        self.assertIsInstance(result, str)
        self.assertEqual(result, expeced_result)

    def test_convert_datetime_to_utc(self):
        result = cutils.convert_datetime(self.datetime_obj)
        self.assertEqual(result, self.datetime_utc)

    def test_convert_datetime_to_local_time(self):
        result = cutils.convert_datetime(self.datetime_utc, to_utc=False)
        self.assertEqual(result, self.datetime_local)

class TestCurrentUtcTime(unittest.TestCase):
    def test_current_utc_time(self):
        result = cutils.current_utc_time()
        self.assertIsInstance(result, datetime)

class TestGetAndVerifyPassword(unittest.TestCase):
    def setUp(self):
        self.password = "abc@123"
        self.hass_password = "$2b$12$sgl2Ulxsj4wzxVR3O5W9YO32ZJ8VjymzlAFYaHnO4OaIf/RE2KNjm"

    def test_get_hashed_password(self):
        result = cutils.get_hashed_password(self.password)      
        self.assertIsInstance(result,str)
    
    def test_verify_password_on_success(self):
        result = cutils.verify_password(self.password, self.hass_password)        
        self.assertTrue(result)

    def test_verify_password_on_failure(self):
        password = "Abc@1234"
        result = cutils.verify_password(password, self.hass_password)        
        self.assertFalse(result)


class TestJwtToken(unittest.TestCase):
    def setUp(self):
        self.payload = {"email": "abc@gmail.com", "role": "coordinator", "exp": 1}
        self.token = "jwt_token"

    @mock.patch("jwt.encode")
    def test_create_access_token(self, mock_encode):
        result = cutils.create_access_token(self.payload)
        self.assertIsInstance(result, dict)
        mock_encode.assert_called_once()

    @mock.patch("jwt.decode")
    def test_verify_jwt_token(self, mock_decode):
        mock_decode.return_value = self.payload
        result = cutils.verify_jwt_token(self.payload)
        self.assertIsInstance(result, AccessToken)
        mock_decode.assert_called_once()

    @mock.patch("jwt.decode")
    def test_verify_jwt_token_expired_token(self, mock_decode):
        mock_decode.side_effect = jwt.ExpiredSignatureError
        with self.assertRaises(ex.TokenExpired):
            cutils.verify_jwt_token(self.token)
        mock_decode.assert_called_once()

    @mock.patch("jwt.decode")
    def test_verify_jwt_token_invalid_token(self, mock_decode):
        mock_decode.side_effect = jwt.InvalidTokenError
        with self.assertRaises(ex.InvalidAccessToken):
            cutils.verify_jwt_token(self.token)
        mock_decode.assert_called_once()

if __name__ == '__main__':
    unittest.main()