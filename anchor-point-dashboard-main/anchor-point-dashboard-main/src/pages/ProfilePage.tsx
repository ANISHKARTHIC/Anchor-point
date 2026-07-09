import * as React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Modal,
  TextField,
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import PhoneWithCountryCode from "../components/PhoneWithCountryCode";
import { BASE_URL } from "../constants/string";

const ProfilePage = () => {
  const userName = localStorage.getItem("userName");
  const userMobile = localStorage.getItem("userMobile");
  const userEmail = localStorage.getItem("userEmail");
  const [profile, setProfile] = useState({
    name: userName ? userName : "",
    mobile: userMobile ? userMobile : "",
    email: userEmail ? userEmail : "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});
  const [numberError, setNumberError] = useState(false);

  // Modal open/close handlers
  const handleOpenModal = () => {
    setEditProfile(profile);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  // Update profile data
  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`${BASE_URL}/coordinators/`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify({
          name: editProfile.name,
          mobile: editProfile.mobile,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error editing profile details");
      }
      localStorage.setItem("userName", editProfile.name);
      localStorage.setItem("userMobile", editProfile.mobile);
      setProfile(editProfile);
      handleCloseModal();
    } catch (err) {
      console.error("Error saving profile data", err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] justify-around w-5/6 md:w-full bg-appBg">
      <div className="h-full mx-6 my-3 bg-white rounded-xl w-full">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            bgcolor: "#FFFFFF",
          }}
        >
          <Card
            sx={{
              width: 300,
              textAlign: "center",
              position: "relative",
              padding: 2,
            }}
          >
            {/* Edit Icon */}
            <IconButton
              aria-label="edit"
              sx={{ position: "absolute", top: 10, right: 10 }}
              onClick={handleOpenModal}
            >
              <EditIcon />
            </IconButton>

            {/* Profile Avatar */}
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 80,
                height: 80,
                margin: "0 auto 16px",
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>

            <CardContent>
              {/* Name */}
              <Typography variant="h6" gutterBottom>
                {profile.name}
              </Typography>

              {/* Mobile Number */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <PhoneIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                <Typography variant="body2">{profile.mobile}</Typography>
              </Box>

              {/* Email */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EmailIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                <Typography variant="body2">{profile.email}</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Edit Modal */}
          <Modal
            open={isModalOpen}
            onClose={handleCloseModal}
            aria-labelledby="edit-profile-modal"
            aria-describedby="modal-to-edit-profile-fields"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 600,
                bgcolor: "background.paper",
                borderRadius: 1,
                boxShadow: 24,
                p: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Edit Profile
              </Typography>

              {/* Name Field */}
              <TextField
                size="small"
                placeholder="Name"
                InputLabelProps={{ shrink: false }}
                fullWidth
                variant="outlined"
                margin="normal"
                value={editProfile.name}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, name: e.target.value })
                }
              />

              {/* Mobile Field */}
              <PhoneWithCountryCode
                phone={editProfile.mobile}
                setPhone={(value) =>
                  setEditProfile({ ...editProfile, mobile: value })
                }
                numberError={numberError}
                setNumberError={setNumberError}
                isfetchGuest={false}
                fetchGuestDetailsByPhone={() => {}}
                isform={false}
                setValue={() => {}}
                variant={"outlined"}
                isDisabled={true}
              />
              {/* <TextField
                label="Mobile"
                fullWidth
                variant="outlined"
                margin="normal"
                value={editProfile.mobile}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, mobile: e.target.value })
                }
              /> */}

              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveChanges}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      </div>
    </div>
  );
};

export default ProfilePage;
