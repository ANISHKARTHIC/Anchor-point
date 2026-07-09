import React, { useEffect, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { BASE_URL } from '../constants/string';
import { TextField } from '@mui/material';
import EditIcon from "@mui/icons-material/Edit";

function Garage(props:any) {

    interface City {
        id: number;
        city: string;
    } 

    const [garages, setGarages] = useState<any[]>([]);
    const [form, setForm] = useState({
      id: null,
      title: '',
      address: '',
      lat: '',
      long: '',
      city: '',
      city_id: 0,
    });     
    const [isAddressSelected, setIsAddressSelected] = useState(false);
    const [sourceError, setSourceError] = useState(false);
    const [autocompleteAddress, setAutocompleteAddress] = useState<any>(null);
    const [cities, setCities] = useState<City[]>([]);
   
    useEffect(() => {
        const fetchCity = async () => {
          try {
            const response = await fetch(`${BASE_URL}/vendors/cities`, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
              },
            });
            const data = await response.json();
            setCities(data.vendor_city);
          } catch (error) {
            console.error("Error fetching city:", error);
          }
        };

        const fetchGarage = async () => {
            try {
              const response = await fetch(`${BASE_URL}/vendors/garage_locations?vendor_id=${props.vendorId}`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
              });
              const data = await response.json();
              setGarages(data.vendor_garage_locations);
            } catch (error) {
              console.error("Error fetching garages:", error);
            }
          };
        fetchCity()
        fetchGarage()
    }, [props.vendorId]);
  
    const handleSubmit = async(e: React.FormEvent) => {
      e.preventDefault();
      if (!isAddressSelected) {
          setSourceError(true);
          return;
      }

      if (form.id == null) {
        // Create
        try{
            const response = await fetch(
                `${BASE_URL}/vendors/garage_locations`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: JSON.stringify({ 
                        vendor_id: props.vendorId, 
                        city_id: form.city_id,
                        title: form.title,
                        address: form.address,
                        latitude: form.lat,
                        longitude: form.long,
                    })
                }
            )
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error creating driver charge");
            }
            setGarages(data.vendor_garage_location)
        } catch(err) {
            console.log(err);
        }
        const newGarage = { ...form, id: Date.now() };
        setGarages([...garages, newGarage]);
      } else {
        // Update
        try{
            const response = await fetch(
                `${BASE_URL}/vendors/garage_locations/${form.id}`,
                {
                    method: "PUT",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: JSON.stringify({ 
                        vendor_id: props.vendorId, 
                        city_id: form.city_id,
                        title: form.title,
                        address: form.address,
                        latitude: form.lat,
                        longitude: form.long,
                    })
                }
            )
            const data = await response.json();
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:",data) : "";
                throw new Error("Error creating driver charge");
            }
            setGarages(
              garages.map(g => (g.id === form.id ? form : g))
            );
        } catch(err) {
            console.log(err);
        }
      }
      resetForm();
    };
  
    const handleEdit = (garage: any) => {
      setForm(garage);
    };
  
    const resetForm = () => {
      setForm({
        id: null,
        title: '',
        address: '',
        lat: '',
        long: '',
        city: '',
        city_id: 0,
      });
    };

    return (
        <div className="p-4 max-w-xl mx-auto">
        <h2 className="text-lg font-bold mb-4">{form.id ? 'Update Garage' : 'Add Garage'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex items-center justify-between gap-12'>
                <span>Title</span>
                <TextField
                    type="text"
                    variant='standard'
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2 border"
                    required
                />
            </div>
          
            <div className='flex items-center justify-between gap-4'>
                <span>Address</span>
                <Autocomplete
                    onLoad={(ac: any) => setAutocompleteAddress(ac)}
                    onPlaceChanged={() => {
                    const selectedPlace = autocompleteAddress?.getPlace();
                    if (selectedPlace && selectedPlace.formatted_address && selectedPlace.geometry) {
                        setForm({...form, 
                            address: selectedPlace.formatted_address,
                            lat: selectedPlace.geometry.location.lat(),
                            long: selectedPlace.geometry.location.lng()
                        })
                        setSourceError(false);
                        setIsAddressSelected(true);
                    } else {
                        setSourceError(true);
                        setIsAddressSelected(false);
                    }}}
                    options={{
                    componentRestrictions: { country: "IN" },
                    }}
                    className="w-full p-2"
                >
                    <TextField
                    type="text"
                    variant="standard"
                    required
                    className="w-full p-2 border"
                    value={form.address}
                    onChange={(e) => {
                        setForm({ ...form, address: e.target.value });
                        setIsAddressSelected(false);
                    }}
                    error={sourceError}
                    helperText={
                        sourceError
                        ? "Please select a suitable place from the list"
                        : ""
                    }
                    />
                </Autocomplete>
            </div>
            <select
                value={form.city_id}
                onChange={e => {
                    console.log(e)
                    setForm({ ...form, city_id: parseInt(e.target.value), city: cities.find(city => city.id == parseInt(e.target.value))?.city || ""})
                }}
                className="w-full p-2 border"
                required
            >
                <option value="">Select City</option>
                {cities.map((c: any, idx) => (
                <option key={idx} value={c.id}>{c.city}</option>
                ))}
            </select>

            <div className="flex justify-center gap-5">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                {form.id ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 rounded">
                Clear
                </button>
            </div>
        </form>

        <hr className="my-6" />

        <h2 className="text-lg font-semibold mb-2">Garage List</h2>
        {garages.length === 0 && <p>No garages added yet.</p>}
        <ul className="space-y-2">
          {garages.map(garage => (
            <li key={garage.id} className="border p-2 rounded">
                <div className='flex items-center justify-between'>
                    <p><strong>{garage.title}</strong> ({garage.city})</p>
                    <div className="flex gap-2 mt-2 justify-end">
                        <button onClick={() => handleEdit(garage)} className="text-blue-600"><EditIcon /></button>
                    </div>
                </div>
                <p>{garage.address}</p>
            </li>
          ))}
        </ul>
      </div>
    )
}

export default Garage;
