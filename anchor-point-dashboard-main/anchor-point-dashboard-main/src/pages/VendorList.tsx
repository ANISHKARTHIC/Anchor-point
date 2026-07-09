import { useState, useEffect } from "react";
import OrganizerVendorView from "../components/OrganizerVendorView";
import { BASE_URL } from "../constants/string";

const VendorComponent = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [update, setupdate] = useState(false);
  const [alertMsg,setAlertMsg] = useState("");
  const [alertType,setAlertType] = useState("");
  const bookingtype = localStorage.getItem("bookingtype");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vendors/?vendor_type=${bookingtype}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        });
        const data = await response.json();
        setVendors(data.vendors);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchVendors();
  }, [update]);

  const fetchVendorById = async (vendorId: any) => {
    try {
      const response = await fetch(`${BASE_URL}/vendors/${vendorId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("userToken"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.vendor;
      } else {
        console.error("Failed to fetch vendor data:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      return null;
    }
  };

  const updateVendor = async (vendorId: any, updatedData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/vendors/${vendorId}`, {
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
        const updatedVendor = await fetchVendorById(vendorId);
        setAlertType("success")
        setAlertMsg("Vendor updated Successfully")
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return updatedVendor;
      } else {
        console.error("Failed to update vendor data:", response.statusText);
        setAlertType("error")
        setAlertMsg(respData.detail)
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return null;
      }
    } catch (error) {
      console.error("Error updating vendor data:", error);
      return null;
    }
  };

  const createVendor = async (data: any) => {
    try {
      const response = await fetch(`${BASE_URL}/vendors/`, {
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
        setAlertMsg("Vendor created Successfully")
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return response;
      } else {
        console.error("Failed to update vendor data:", response.statusText);
        setAlertType("error")
        setAlertMsg(respData.detail)
        setTimeout(() => {
            setAlertMsg("")
        }, 3000);
        return null;
      }
    } catch (error) {
      console.error("Error updating vendor data:", error);
      return null;
    }
  };

  return (
    <OrganizerVendorView
      users={vendors}
      setUsers={setVendors}
      selectedUser={selectedVendor}
      onUserClick={setSelectedVendor}
      fetchUserById={fetchVendorById}
      updateUser={updateVendor}
      isOrganizer={false}
      createUser={createVendor}
      alertMsg={alertMsg}
      alertType={alertType}
    />
  );
};

export default VendorComponent;
