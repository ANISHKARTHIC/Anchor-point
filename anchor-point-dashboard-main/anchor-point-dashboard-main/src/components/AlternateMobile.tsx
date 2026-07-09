import { MuiTelInput } from "mui-tel-input";
import { PhoneNumberUtil } from "google-libphonenumber";

interface AlternateMobile {
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

const AlternateMobile: React.FC<AlternateMobile> = ({
  alternateMobile,
  setAlternatePhone,
  alternateNumberError,
  setAlternateNumberError,
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
      value={alternateMobile}
      defaultCountry="IN"
      variant="outlined"
      sx={{ width: "100%" }}
      // disabled={!isDisabled}
      onChange={(e: any, info: any) => {
        isform ? setValue("alternate_mobile", e) : "";
        setAlternatePhone(e);
        let number = phoneUtil.parse(e, info.countryCode),
          isValidNumber = phoneUtil.isValidNumber(number);
        isValidNumber ? setAlternateNumberError(false) : setAlternateNumberError(true);
        isValidNumber && isfetchGuest ? fetchGuestDetailsByPhone(e) : "";
      }}
      size="small"
      error={alternateNumberError}
      helperText={alternateNumberError? "Enter valid phone number" : ""}
    />
  );
};

export default AlternateMobile;