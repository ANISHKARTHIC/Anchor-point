/* eslint-disable @typescript-eslint/no-explicit-any */
import circle from "../assets/pointCircle.svg";
import powered from "../assets/anchorpoint.png";
import { BASE_URL, STRING_ALERT, STRING_LOGIN } from "../constants/string";
import { ROUTE } from "../constants/routes";
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
            sx={{ color: "#475569" }}
          >
            <ArrowBackIcon />
            <span className="ml-1 text-sm font-medium">Back</span>
          </IconButton>
        </div>
        <div className="mt-4">
          <Typography fontSize={18} fontWeight={500} className="text-slate-800">
            {STRING_LOGIN.TEXT_ENTEROTP}
          </Typography>
          <Typography fontSize={13} className="text-slate-400 mt-1">
            We've sent a 6-digit code to your email
          </Typography>
        </div>
        <div className="mt-4">
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
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
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
            gap={1.5}
            value={otp}
            onChange={(val) => setOTP(val)}
          ></MuiOtpInput>
        </div>
        <div className="mt-6 w-100 flex justify-center">
          <LoadingButton
            variant="contained"
            className="w-[50%] h-11 p-1"
            onClick={submitOTP}
            loading={status === "Loading"}
            sx={{
              backgroundColor: "#334155",
              borderRadius: "8px",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#475569" },
            }}
          >
            <span>{STRING_LOGIN.LABEL_CONFIRM}</span>
          </LoadingButton>
        </div>
      </>
    );
  };
  const renderGetDetailsInput = () => {
    return (
        <Dialog keepMounted  sx={{ '& .MuiDialog-paper': { width: '30%', maxHeight: 435, borderRadius: '16px' } }} maxWidth={'lg'} open={showDetailsInput}>
          <DialogTitle sx={{ fontWeight: 600, color: "#0F172A" }}>Let's Get Started</DialogTitle>
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
                  sx={{ color: "#94A3B8", mr: 1, my: 0.5 }}
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
          <DialogActions sx={{ padding: "12px 20px" }}>
            <Button
              disabled={userName.length === 0 || phoneNumber.length === 0}
              onClick={handleDetailsSubmit}
              variant="contained"
              sx={{
                backgroundColor: "#334155",
                "&:hover": { backgroundColor: "#475569" },
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
    );
  };
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl"></div>
        </div>

        {/* Alert messages */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          {status === "error" && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>
              {data ? (
                <p>
                  {data.message.detail} - {STRING_ALERT.CHECK}
                </p>
              ) : (
                <p>{STRING_ALERT.DEFAULT}</p>
              )}
            </Alert>
          )}
          {info.msg && (
            <Alert severity={info.type} sx={{ borderRadius: "8px", mt: 1 }}>
              <p>{info.msg}</p>
            </Alert>
          )}
        </div>

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl px-8 py-10 border border-white/20">
            {/* Brand Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-0.5 mb-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">ANCHORP</span>
                <img src={circle} className="w-5 h-5 mt-0.5" />
                <span className="text-2xl font-bold tracking-tight text-slate-900">INT</span>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Travel Management Platform
              </p>
            </div>

            {!token ? (
              <div>
                {!isForgot ? (
                  showOTP ? (
                    <>{renderOTPInput()}{renderGetDetailsInput()}</>
                  )  : (
                    <div>
                      <p className="text-sm text-slate-500 mb-6">
                        {STRING_LOGIN.TEXT_HELPER_SIGN_IN}
                      </p>
                      <div>
                        <Stack spacing={2.5}>
                          <TextField
                            label="Email Address"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PersonIcon sx={{ color: "#94A3B8" }} />
                                </InputAdornment>
                              ),
                            }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            helperText={errors.email && errors.email}
                            size="small"
                          />
                          {!isCoordinator && (
                            <TextField
                              label="Password"
                              type="password"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockIcon sx={{ color: "#94A3B8" }} />
                                  </InputAdornment>
                                ),
                              }}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              error={errors.password}
                              helperText={errors.password && errors.password}
                              size="small"
                            />
                          )}
                        </Stack>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={isVendor}
                                onChange={(e) => {
                                  setIsVendor(e.target.checked);
                                  setIsCoordinator(false);
                                }}
                              />
                            }
                            label={
                              <span className="text-sm text-slate-600">
                                {STRING_LOGIN.LABEL_VENDOR}
                              </span>
                            }
                          />
                        </FormGroup>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                disabled={isVendor}
                                checked={isCoordinator}
                                onChange={(e) =>
                                  setIsCoordinator(e.target.checked)
                                }
                              />
                            }
                            label={
                              <span className={`text-sm ${isVendor ? "text-slate-300" : "text-slate-600"}`}>
                                {STRING_LOGIN.LABEL_COORDINATOR}
                              </span>
                            }
                          />
                        </FormGroup>
                      </div>
                      <div className="mt-6">
                        <LoadingButton
                          variant="contained"
                          className="w-full"
                          onClick={handleClick}
                          loading={status === "Loading"}
                          sx={{
                            backgroundColor: "#334155",
                            padding: "10px 0",
                            fontSize: "0.95rem",
                            fontWeight: 500,
                            borderRadius: "8px",
                            "&:hover": { backgroundColor: "#475569" },
                          }}
                        >
                          <span>{STRING_LOGIN.LABEL_SIGN_IN}</span>
                        </LoadingButton>
                      </div>
                      {!isCoordinator && (
                        <div className="mt-4 text-center">
                          <Link
                            component="button"
                            variant="inherit"
                            onClick={() => {
                              setIsForgot(true);
                              setEmail("");
                              setPassword("");
                            }}
                            sx={{ 
                              color: "#64748B", 
                              fontSize: "0.85rem",
                              textDecoration: "none",
                              "&:hover": { color: "#334155" },
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
                        sx={{ color: "#475569" }}
                      >
                        <ArrowBackIcon fontSize="small" />
                        <span className="ml-1 text-sm font-medium">Back</span>
                      </IconButton>
                    </div>

                    <div className="mt-4">
                      <Typography fontSize={14} className="text-slate-500">
                        Enter your email address and role to receive a password reset link
                      </Typography>
                    </div>
                    <div className="mt-5">
                      <Stack spacing={2.5} className="mt-3">
                        <TextField
                          label="Email Address"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: "#94A3B8" }} />
                              </InputAdornment>
                            ),
                          }}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          error={errors.email}
                          helperText={errors.email && errors.email}
                          size="small"
                        />
                        <FormControl>
                          <FormLabel id="role-label" sx={{ color: "#475569", fontSize: "0.875rem", fontWeight: 500 }}>Role</FormLabel>
                          <RadioGroup
                            row
                            aria-labelledby="role-label"
                            defaultValue="organizer"
                            name="radio-buttons-group"
                            onChange={(e) => setRole(e.target.value)}
                          >
                            <FormControlLabel
                              value="organizer"
                              control={<Radio size="small" />}
                              label={<span className="text-sm text-slate-600">Organizer</span>}
                            />
                            <FormControlLabel
                              value="vendor"
                              control={<Radio size="small" />}
                              label={<span className="text-sm text-slate-600">Vendor</span>}
                            />
                          </RadioGroup>
                        </FormControl>
                        <div className="mt-5">
                          <LoadingButton
                            variant="contained"
                            className="w-full"
                            onClick={handlePasswordReset}
                            loading={status === "Loading"}
                            sx={{
                              backgroundColor: "#334155",
                              padding: "10px 0",
                              fontWeight: 500,
                              borderRadius: "8px",
                              "&:hover": { backgroundColor: "#475569" },
                            }}
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
              <div className="min-w-[400px] min-h-[250px]">
                <Typography fontSize={14} className="text-slate-500 mb-4">
                  Enter your new password below
                </Typography>
                <Stack spacing={2.5}>
                  <TextField
                    label="New Password"
                    type="password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "#94A3B8" }} />
                        </InputAdornment>
                      ),
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    helperText={errors.password && errors.password}
                    size="small"
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: "#94A3B8" }} />
                        </InputAdornment>
                      ),
                    }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    helperText={errors.confirmPassword && errors.confirmPassword}
                    size="small"
                  />
                </Stack>
                <div className="mt-6">
                  <LoadingButton
                    variant="contained"
                    className="w-full"
                    onClick={handleConfirmPassword}
                    loading={status === "Loading"}
                    sx={{
                      backgroundColor: "#334155",
                      padding: "10px 0",
                      fontWeight: 500,
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "#475569" },
                    }}
                  >
                    <span>{"Reset Password"}</span>
                  </LoadingButton>
                </div>
              </div>
            ) : (
              <div className="min-w-[400px] min-h-[200px] flex flex-col gap-4 items-center justify-center">
                <Typography fontSize={18} fontWeight={500} className="text-slate-800 text-center">
                  The password reset link has expired
                </Typography>
                <Typography fontSize={14} className="text-slate-400 text-center">
                  Please initiate a forgot password request again.
                </Typography>
              </div>
            )}
          </div>
          
          {/* Powered by footer */}
          <div className="flex justify-center mt-6">
            <img src={powered} className="h-5 opacity-50" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
