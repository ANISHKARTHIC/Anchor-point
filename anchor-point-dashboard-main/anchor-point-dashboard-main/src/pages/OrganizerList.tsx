import { useState, useEffect } from "react";
import OrganizerVendorView from "../components/OrganizerVendorView";
import { BASE_URL } from "../constants/string";

const OrganizerComponent = () => {
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [update, setupdate] = useState(false);
  const [alertMsg,setAlertMsg] = useState("");
  const [alertType,setAlertType] = useState("");

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/organizers/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        const data = await response.json();
        setOrganizers(data.organizers);
      } catch (error) {
        console.error("Error fetching organizers:", error);
      }
    };

    fetchOrganizers();
  }, [update]);

  const fetchOrganizerById = async (orgnaizerId: any) => {
    try {
      const response = await fetch(`${BASE_URL}/organizers/${orgnaizerId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.organizer;
      } else {
        console.error("Failed to fetch organizer data:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching organizer data:", error);
      return null;
    }
  };

  const updateOrganizer = async (organizerId: any, updatedData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/organizers/${organizerId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(updatedData),
      });

      const respData = await response.json()

      if (response.ok) {
        const updatedOrganizer = await fetchOrganizerById(organizerId);
        setAlertType("success")
        setAlertMsg("Organizer updated Successfully")
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return updatedOrganizer;
      } else {
        console.error("Failed to update organizer data:", response.statusText);
        setAlertType("error")
        setAlertMsg(respData.detail)
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return null;
      }
    } catch (error) {
      console.error("Error updating organizer data:", error);
      return null;
    }
  };

  const createOrganizer = async (data: any) => {
    try {
      const response = await fetch(`${BASE_URL}/organizers/`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
        body: JSON.stringify(data),
      });
      setupdate(!update);

      const respData = await response.json()

      if (response.ok) {
        setAlertType("success")
        setAlertMsg("Organizer created Successfully")
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return response;
      } else {
        console.error("Failed to create organizer data:", response.statusText);
        setAlertType("error")
        setAlertMsg(respData.detail)
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return null;
      }
    } catch (error) {
      console.error("Error creating organizer data:", error);
      return null;
    }
  };

  return (
    <OrganizerVendorView
      users={organizers}
      setUsers={setOrganizers}
      selectedUser={selectedOrganizer}
      onUserClick={setSelectedOrganizer}
      fetchUserById={fetchOrganizerById}
      updateUser={updateOrganizer}
      isOrganizer={true}
      createUser={createOrganizer}
      alertMsg={alertMsg}
      alertType={alertType}
    />
  );
};

export default OrganizerComponent;
