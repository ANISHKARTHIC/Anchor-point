/* eslint-disable @typescript-eslint/no-explicit-any */
import quote from "../assets/travelBuddy.png";
import circle from "../assets/pointCircle.svg";
import powered from "../assets/anchorpoint.png";
import { BASE_URL, STRING_ALERT, STRING_LOGIN } from "../constants/string";
import { ROUTE } from "../constants/routes";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import {
  InputAdornment,
  Stack,
  TextField,
  Alert,
  FormGroup,
  FormControlLabel,
  Link,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin, validateOTP } from "../store/features/authSlice";
import { AppDispatch } from "../store/store";
import { Checkbox } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { MuiOtpInput } from "mui-one-time-password-input";
import PhoneWithCountryCode from "../components/PhoneWithCountryCode";
import { Box } from "@mui/system";
import { AccountCircle } from "@mui/icons-material";
import { handleFirebaseAuth } from "../firebase";

function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data, status } = useSelector((state: any) => state.auth);
  const { token } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [isVendor, setIsVendor] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [role, setRole] = useState("organizer");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [info, setInfo] = useState({
    msg: "",
    type: "",
  });
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState("");
  const [showDetailsInput, setShowDetailsInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<any>("");
  const [userName, setUserName] = useState("");
  const [numberError, setNumberError] = useState(false);

  useEffect(() => {
    const checkTokenValitidy = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/validate`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail);
        }
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
        console.log(error);
      }
    };
    token ? checkTokenValitidy() : "";
  }, [token]);

  const handleClick = async (e: any) => {
    e.preventDefault();
    const validationErrors: any = {};
    if (!email.trim()) {
      validationErrors.email = "Username is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = "Username is not valid";
    }
    if (!isCoordinator) {
      if (!password.trim()) {
        validationErrors.password = "Password is required";
      } else if (password.length < 5) {
        validationErrors.password = "Password should be atleast 5 characters";
      }
    }
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      await dispatch(
        adminLogin({ email, password, isVendor, isCoordinator }),
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          if (isCoordinator) {
            setShowOTP(true);
          } else {
            //navigate(ROUTE.HOME);
            if(isVendor){
              handleNavigation()
            }
            else{
              getFireBaseCustomToken()
            }
            
          }
        }
      });
    }
  };
  const getFireBaseCustomToken = async() => {
        try{
          const response = await fetch(`${BASE_URL}/firebase/generate-token`, {
            method: "POST",
            headers: {
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          });
          const data = await response.json()
          if(data.firebase_access_token){
            localStorage.setItem("firebaseAccessToken",data.firebase_access_token )
            handleFirebaseAuth(data.firebase_access_token).then((user)=>{
            }).catch(err=>{
              console.error("Error in Firebase Auth",err)
            }).finally(()=>{
              handleNavigation()
            })
          }
        }catch(err){
          console.error("Firebase Custom Token Error",err)
        }
                
  }
  const handleNavigation=()=>{
    if (isCoordinator){
      navigate(ROUTE.HOME+"/"+ROUTE.BOOKINGS);
    }
    else{
      navigate(ROUTE.HOME);
    }
  }
  const handlePasswordReset = async (e: any) => {
    const validationErrors: any = {};
    if (!email.trim()) {
      validationErrors.email = "email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = "email is not valid";
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            role: role,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail);
        }
        setInfo({ msg: data.message, type: "success" });
      } catch (error) {
        setInfo({ msg: error.message, type: "error" });
      }
    }
  };

  const handleConfirmPassword = async () => {
    const validationErrors: any = {};

    if (!password.trim()) {
      validationErrors.password = "Password is required";
    } else if (
      !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(password)
    ) {
      validationErrors.password =
        "Please enter a strong password with 8 characters,\n capitals, numbers and special characters";
    }

    if (!confirmPassword.trim()) {
      validationErrors.confirmPassword = "Confirm password is required";
    } else if (confirmPassword.trim() != password.trim()) {
      validationErrors.confirmPassword =
        "Confirm password should be same as password entered";
    }
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await fetch(`${BASE_URL}/auth/reset-password`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: password,
            confirm_password: confirmPassword,
            token: token,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail);
        }
        setInfo({ msg: data.message, type: "success" });
        setTimeout(() => {
          navigate("../" + ROUTE.LOGIN);
          setInfo({
            msg: "",
            type: "",
          });
          setPassword("");
        }, 1000);
      } catch (error) {
        setInfo({ msg: error.message, type: "error" });
      }
    }
  };
  const submitOTP = async () => {
    let pattern = /(?<!\d)\d{6}(?!\d)/g;
    if (pattern.test(otp)) {
      await dispatch(validateOTP({ email, otp })).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          
          const { name, mobile } = result.payload;
          if (!(name && mobile)) {
            setShowDetailsInput(true);
          }
          else{
            getFireBaseCustomToken()
            //navigate(ROUTE.HOME+"/"+ROUTE.BOOKINGS);
          }
        }
      });
    } else {
      return <Alert severity="error">InValid OTP Format</Alert>;
    }
  };
  const handleDetailsSubmit = async() => {
    if(numberError){
      alert("InValid Phone Number")
      return
    }
    try{
      const response = await fetch(`${BASE_URL}/coordinators/`, {
        method: "PUT",
        headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name:userName,
          mobile : phoneNumber.replaceAll(/\s/g,'')
        })
    });
    localStorage.setItem("userName", userName);
    localStorage.setItem("userMobile",phoneNumber)
    getFireBaseCustomToken()
    //navigate(ROUTE.HOME+"/"+ROUTE.BOOKINGS);
    }catch(err){
      console.error("Error in Updating User Name and Mobile")
      alert("InValid Phone Number or Name")
    }
  };
  const renderOTPInput = () => {
    return (
      <>
        <div>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => {
              setShowOTP(false);
              setOTP("");
            }}
          >
            <ArrowBackIcon />
            Back
          </IconButton>
        </div>
        <div className="mt-2"></div>
        <Typography fontSize={20}>{STRING_LOGIN.TEXT_ENTEROTP}</Typography>
        <div className="mt-2"></div>
        <MuiOtpInput
          className="w-[400px]"
          sx={{
            "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
          }}
          inputMode="numeric"
          TextFieldsProps={{
            type: "number",
            inputProps: {
              inputMode: "numeric",
              pattern: "[0-9]*",
            },
            size: "small",
          }}
          length={6}
          gap={2}
          value={otp}
          onChange={(val) => setOTP(val)}
        ></MuiOtpInput>
        <div className="mt-5 w-100 flex justify-center">
          <LoadingButton
            variant="contained"
            className="w-[50%] h-11  p-1"
            onClick={submitOTP}
            loading={status === "Loading"}
          >
            <span>{STRING_LOGIN.LABEL_CONFIRM}</span>
          </LoadingButton>
        </div>
      </>
    );
  };
  const renderGetDetailsInput = () => {
    return (
        <Dialog keepMounted  sx={{ '& .MuiDialog-paper': { width: '30%', maxHeight: 435 } }} maxWidth={'lg'} open={showDetailsInput}>
          <DialogTitle>Lets Get Started</DialogTitle>
          <DialogContent dividers>
            <Stack gap={3}>
              <PhoneWithCountryCode
                phone={phoneNumber}
                setPhone={setPhoneNumber}
                numberError={numberError}
                setNumberError={setNumberError}
                isfetchGuest={false}
                fetchGuestDetailsByPhone={() => {}}
                isform={false}
                isDisabled={true}
                setValue={() => {}}
              />
              <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                <AccountCircle
                  sx={{ color: "action.active", mr: 1, my: 0.5 }}
                />
                <TextField
                  fullWidth={true}
                  id="input-with-sx"
                  label="Name"
                  variant="standard"
                  onChange={(e) => setUserName(e.target.value)}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              disabled={userName.length === 0 || phoneNumber.length === 0}
              onClick={handleDetailsSubmit}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
    );
  };
  return (
    <>
      <div className="bg-gradient-to-r from-primary to-secondary h-screen flex items-center justify-around flex-col">
        {status === "error" && (
          <Alert severity="error">
            {data ? (
              <p>
                {data.message.detail} - {STRING_ALERT.CHECK}
              </p>
            ) : (
              <p>{STRING_ALERT.DEFAULT}</p>
            )}
          </Alert>
        )}
        {info && (
          <Alert severity={info.type}>
            <p>{info.msg}</p>
          </Alert>
        )}
        <img src={quote} alt="Travel Buddy" />
        <div className="bg-[rgb(255,255,255)] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-[8.5px] rounded-xl text-black mx-4 px-2 md:px-4 py-6">
          <div className="flex justify-center items-center mb-2">
            <p className="font-normal text-[17px] mt-[3px]  leading-4">
              {STRING_LOGIN.TEXT_GREET}
            </p>
            <div className="flex mx-3">
              <h1>{STRING_LOGIN.TEXT_ANCHORP}</h1>
              <img src={circle} className="w-5" />
              <h1>{STRING_LOGIN.TEXT_INT}</h1>
            </div>
            <WavingHandIcon className="mb-0.5 text-skin" />
          </div>
          {!token ? (
            <div>
              {!isForgot ? (
                showOTP ? (
                  <>{renderOTPInput()}{renderGetDetailsInput()}</>
                )  : (
                  <div>
                    <p className="text-sm font-normal mt-1">
                      {STRING_LOGIN.TEXT_HELPER_SIGN_IN}
                    </p>
                    <div className="mt-5">
                      <Stack spacing={2}>
                        <TextField
                          label="User Name"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon />
                              </InputAdornment>
                            ),
                          }}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          error={errors.email}
                          helperText={errors.email && errors.email}
                        />
                        {!isCoordinator && (
                          <TextField
                            label="Password"
                            type="password"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LockIcon />
                                </InputAdornment>
                              ),
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            helperText={errors.password && errors.password}
                          />
                        )}
                      </Stack>
                    </div>
                    <div className=" mt-3">
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isVendor}
                              onChange={(e) => {
                                setIsVendor(e.target.checked);
                                setIsCoordinator(false);
                              }}
                            />
                          }
                          label={STRING_LOGIN.LABEL_VENDOR}
                        />
                      </FormGroup>
                    </div>
                    <div
                      className={`mt-1 ${
                        isVendor ? "opacity-30" : "opacity-100"
                      }`}
                    >
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              disabled={isVendor}
                              checked={isCoordinator}
                              onChange={(e) =>
                                setIsCoordinator(e.target.checked)
                              }
                            />
                          }
                          label={STRING_LOGIN.LABEL_COORDINATOR}
                        />
                      </FormGroup>
                    </div>
                    <div className="mt-5">
                      <LoadingButton
                        variant="contained"
                        className="w-full p-1"
                        onClick={handleClick}
                        loading={status === "Loading"}
                      >
                        <span>{STRING_LOGIN.LABEL_SIGN_IN}</span>
                      </LoadingButton>
                    </div>
                    {!isCoordinator && (
                      <div className="mt-3">
                        <Link
                          component="button"
                          variant="inherit"
                          onClick={() => {
                            setIsForgot(true);
                            setEmail("");
                            setPassword("");
                          }}
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div>
                  <div>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => {
                        setIsForgot(false);
                        setEmail("");
                      }}
                    >
                      <ArrowBackIcon />
                      Back
                    </IconButton>
                  </div>

                  <div className="mt-4">
                    <span>
                      Please enter the email-id and role to send the
                      verification link
                    </span>
                  </div>
                  <div className="mt-5">
                    <Stack spacing={2} className="mt-3">
                      <TextField
                        label="Enter email ID"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                        helperText={errors.email && errors.email}
                      />
                      <FormControl>
                        <FormLabel id="role-label">Role</FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="role-label"
                          defaultValue="organizer"
                          name="radio-buttons-group"
                          onChange={(e) => setRole(e.target.value)}
                        >
                          <FormControlLabel
                            value="organizer"
                            control={<Radio />}
                            label="Organizer"
                          />
                          <FormControlLabel
                            value="vendor"
                            control={<Radio />}
                            label="Vendor"
                          />
                        </RadioGroup>
                      </FormControl>
                      <div className="mt-5">
                        <LoadingButton
                          variant="contained"
                          className="w-full p-1"
                          onClick={handlePasswordReset}
                          loading={status === "Loading"}
                        >
                          <span>{"Request password reset"}</span>
                        </LoadingButton>
                      </div>
                    </Stack>
                  </div>
                </div>
              )}
            </div>
          ) : isValidToken ? (
            <div className="min-w-[500px] min-h-[300px]">
              <Stack spacing={2}>
                <span>Enter new password and confirm password</span>
                <TextField
                  label="Password"
                  type="password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  helperText={errors.password && errors.password}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  helperText={errors.confirmPassword && errors.confirmPassword}
                />
              </Stack>
              <div className="mt-8">
                <LoadingButton
                  variant="contained"
                  className="w-full p-1"
                  onClick={handleConfirmPassword}
                  loading={status === "Loading"}
                >
                  <span>{"Reset Password"}</span>
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className="min-w-[500px] min-h-[300px] flex flex-col gap-4 items-center justify-center ">
              <Typography fontSize={20}>
                The password confirmation link has expired!
              </Typography>
              <Typography fontSize={18}>
                Please initiate forgot password request again.
              </Typography>
            </div>
          )}
        </div>
        <img src={powered} />
      </div>
    </>
  );
}

export default Login;
