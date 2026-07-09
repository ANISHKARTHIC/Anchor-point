import { MuiTelInput } from "mui-tel-input";
import { PhoneNumberUtil } from "google-libphonenumber";

interface PhoneWithCountryCodeProps {
  phone: any;
  setPhone: (data: any) => void;
  numberError: any;
  setNumberError: (data: any) => void;
  isfetchGuest: boolean;
  fetchGuestDetailsByPhone: (data: any) => void;
  isform: boolean;
  setValue: (name: any, value: any) => void;
  variant?: string;
  isDisabled: any;
}

const PhoneWithCountryCode: React.FC<PhoneWithCountryCodeProps> = ({
  phone,
  setPhone,
  numberError,
  setNumberError,
  isfetchGuest,
  fetchGuestDetailsByPhone,
  isform,
  setValue,
  variant = "standard",
  isDisabled,
}) => {
  const phoneUtil = PhoneNumberUtil.getInstance();

  return (
    <MuiTelInput
      value={phone}
      defaultCountry="IN"
      variant="outlined"
      sx={{ width: "100%" }}
      disabled={!isDisabled}
      onChange={(e: any, info: any) => {
        isform ? setValue("mobile", e) : "";
        setPhone(e);
        let number = phoneUtil.parse(e, info.countryCode),
          isValidNumber = phoneUtil.isValidNumber(number);
        isValidNumber ? setNumberError(false) : setNumberError(true);
        isValidNumber && isfetchGuest ? fetchGuestDetailsByPhone(e) : "";
      }}
      size="small"
      error={numberError}
      helperText={numberError ? "Enter valid phone number" : ""}
    />
  );
};

export default PhoneWithCountryCode;
