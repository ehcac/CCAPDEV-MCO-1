import { useAuth } from '../../AuthProvider.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconEdit, IconTrash, IconCheck } from '@tabler/icons-react';

import pfp1 from '../../assets/pfp1.jpg';
import pfp2 from '../../assets/pfp2.jpg';
import pfp3 from '../../assets/pfp3.jpg';

export default function Profile() {
    const navigate = useNavigate();
    const auth = useAuth();

    const [canEdit, setCanEdit] = useState(true);
    const [canDelete, setCanDelete] = useState(true);
    const [editMode, setEditMode] = useState(false);
    
    const [reservations, setReservations] = useState([]);
    const [reservationVisuals, setReservationVisuals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pfpUrl, setPfpUrl] = useState(pfp1);
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [reset, setReset] = useState(Date.now());

    const { id } = useParams();

    const [user, setUser] = useState(() => {
        return (JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"))) ?? null
    });

    const apiUrl = process.env.REACT_APP_API_URL;


    const columnHeader = [
        {label: "Name", accessor: "fullName"},
        {label: "Laboratory", accessor: "labID"},
        {label: "Seat", accessor: "seatNumber"}, 
        {label: "Reservation Date", accessor: "formattedReservationDate"},
        {label: "Timeslot", accessor: "timeSlots"},
        {label: "Time of Request", accessor: "formattedCreatedAt"},
        {label: "", accessor:"edit"},
        {label: "", accessor:"cancel"}
    ];



    const getReservationVisuals = () => {
        const reservationVisuals = reservations.map((reservation, index) => {
            return (
                <tr key={index} className="odd:bg-white even:bg-fieldgray hover:bg-bgpink">
                    {columnHeader.map((column) =>
                        reservation.hasOwnProperty(column.accessor) ? (
                            <td key={`${column.accessor}-${index}`} className="py-1 px-2">
                                {reservation[column.accessor]}
                            </td>
                        ) : null
                    )}
    
                    <td>
                        <IconEdit stroke={2} className="cursor-pointer" onClick={() => navigate(`/edit/${reservation._id}`)} />
                    </td>
                    <td>{/**TODO: change logic */}
                        <IconTrash stroke={2} color="#cc5f5f" className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleDelete(reservation._id); }} />
                    </td>
                    <td></td>
                </tr>
            );
        });
    
        setReservationVisuals(reservationVisuals); 
    };    

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));;
                if (!storedUser) throw new Error("User not found in localStorage");
        
                const response = await fetch(`http://localhost:5000/api/profile/${storedUser.id}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
                const data = await response.json();
                setUser(data);
                setPfpUrl(data.profilePicture || pfp1);
                setCanEdit(data.role === "technician");
                setCanDelete(data.role === "student"); 
            } catch (err) {
                console.error("Error fetching user data:", err);
            }
        };        
        
        fetchProfile(); 
    }, [id]);

    useEffect(() => {
        const getReservations = async () => {
            try {
                //const storedUser = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));;

                if (!user) {
                    throw new Error("User not logged in");
                }
                //console.log("user.otherID:", user.otherID);

                const response = await fetch(`${apiUrl}/api/reservations/${user.otherID}`, {
                    method: 'GET',
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();

                const formattedData = data.map((reservation) => {
                    const startTimes = Array.isArray(reservation.startTime) ? reservation.startTime : [reservation.startTime];
                    const endTimes = Array.isArray(reservation.endTime) ? reservation.endTime : [reservation.endTime];
    
                    // Map over time slots to format "HH:mm - HH:mm"
                    const timeSlots = startTimes.map((startTime, index) => {
                        const endTime = endTimes[index] || startTime; // Prevent undefined endTime
    
                        if (!startTime || !endTime) return null; // Skip invalid entries
    
                        const formattedStart = new Date(startTime).toLocaleTimeString("en-US", { 
                            hour12: false, 
                            hour: "2-digit", 
                            minute: "2-digit",
                            timeZone: "Asia/Singapore"
                        });
    
                        const formattedEnd = new Date(endTime).toLocaleTimeString("en-US", { 
                            hour12: false, 
                            hour: "2-digit", 
                            minute: "2-digit",
                            timeZone: "Asia/Singapore"
                        });
    
                        //console.log(formattedStart, "-", formattedEnd);
                        return `${formattedStart} - ${formattedEnd}`;
                    }).filter(Boolean); // Remove any null values
    
                    return {
                        ...reservation,
                        fullName: `${reservation.userDetails.firstName} ${reservation.userDetails.lastName}`,
                        formattedReservationDate: new Date(startTimes[0]).toLocaleDateString("en-US", { 
                            month: "long",
                            day: "2-digit",
                            year: "numeric"
                        }),
                        timeSlots: timeSlots.join(", "), // Properly join multiple slots
                        formattedCreatedAt: new Date(reservation.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour12: false, 
                            hour: "2-digit", 
                            minute: "2-digit",
                            timeZone: "Asia/Singapore"
                        })
                    };
                });

                setReservations(formattedData);
            } catch (err) {
                console.error("Error fetching reservations:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getReservations(); // Fetch reservations for the logged-in user
    }, [auth.user]);

    useEffect(() => {
        getReservationVisuals();
    }, [reservations]);
    
    const handleSave = async () => {
        try {
            //confirmation message
            const confirmation = window.confirm("Are you sure you want to submit this reservation?");
            if (!confirmation) {
                setEditMode(false);
                return; 
            }
            const storedUser = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));;
            if (!storedUser) throw new Error("User not found in localStorage");
    
            const formData = new FormData();
            formData.append("description", description);
            if (selectedImage) {
                formData.append("profilePicture", selectedImage);
            } else {
                formData.append("profilePicture", pfpUrl);
            }
    
            const response = await fetch(`${apiUrl}/api/profile/${storedUser.id}`, {
                method: "POST",
                body: formData,
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
            }
    
            const updatedUser = await response.json();
            setUser(updatedUser);
            setPfpUrl(updatedUser.profilePicture || pfp1);
            setEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(`Failed to update profile: ${error.message}`);
        }
    };
    
    const handleDelete = async (reservationId) => {
        if (!window.confirm("Are you sure you want to delete this reservation?")) {
            return;
        }
    
        try {
            const response = await fetch(`${apiUrl}/api/reservations/delete/${reservationId}`, {
                method: "DELETE",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.statusText}`);
            }
    
           
                setReservations((prevReservations) =>
                prevReservations.filter((reservation) => reservation._id !== reservationId)
            );
    
            alert("Reservation deleted successfully.");
        } catch (error) {
            console.error("Error deleting reservation:", error);
            alert(`Failed to delete reservation: ${error.message}`);
        }
    };    

    const handleDeleteProfile = async () => {
        if (!confirm("Are you sure you want to delete this profile?")) {
            return; 
        }
    
        try {
            const storedUser = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
            
            if (!storedUser) throw new Error("User not found in localStorage or sessionStorage");
    
            const userID = storedUser.id;
            const otherID = storedUser.otherID; 
            
            if (!userID) throw new Error("User ID is not available");
    
            // delete reservations
            try {
                if (otherID) {
                    //console.log("Deleting reservations for:", otherID);
                    const resResponse = await fetch(`${apiUrl}/api/reservations/deleteAll/${otherID}`, {
                        method: "DELETE",
                    });
    
                    if (!resResponse.ok) {
                        const errorData = await resResponse.json();
                        console.error("Failed to delete reservations:", errorData);
                        throw new Error(errorData.message || `Error: ${resResponse.statusText}`);
                    }
                    //console.log("Reservations deleted successfully");
                    const resData = await resResponse.json(); 
                    alert(JSON.stringify(resData.message));
                }
            } catch (error) {
                console.error("Error deleting reservations:", error);
                alert(`Failed to delete reservations: ${error.message}`);
            }
    
            // delete profile
            try {
                //console.log("Deleting profile with ID:", userID);
                const response = await fetch(`${apiUrl}/api/profile/delete/${userID}`, {
                    method: "DELETE",
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Failed to delete profile:", errorData);
                    throw new Error(errorData.message || `Error: ${response.statusText}`);
                }
                
                //alert("Profile deleted successfully");
                setEditMode(false);
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                sessionStorage.removeItem("user");
                sessionStorage.removeItem("token");
                navigate("/login");
    
            } catch (error) {
                console.error("Error deleting profile:", error);
                alert(`Failed to delete profile: ${error.message}`);
            }
    
        } catch (error) {
            console.error("Unexpected error:", error);
            alert(`Something went wrong: ${error.message}`);
        }
    };
    
    
    return (
        <>
            <div className="flex flex-col border-2 border-bgblue p-4 rounded-lg">
                <div className="flex flex-row">
                    {
                        !editMode ? 
                            <>
                                <img
                                    src={pfpUrl}
                                    className="w-[150px]"
                                    alt="Profile Picture"
                                />

                                <div className="flex flex-col ml-12 w-full">
                                    <div className='text-[24px] text-fontgray pb-1.5'>
                                        Name: {user.firstName + " " + user.lastName}
                                    </div>
                                    <div className='text-fontgray'>
                                        Description: {user.description}
                                    </div>
                                </div>

                                {
                                    (user.role === "technician" || user.role === "student") && 
                                        <div className='w-fit flex flex-row-reverse'>
                                            <IconEdit stroke={2} onClick={() => setEditMode(!editMode)} />
                                        </div>
                                }
                            </>
                        : 
                            <>
                                <div className="w-fit flex flex-col gap-2">
                                    <img
                                        src={selectedImage ? URL.createObjectURL(selectedImage) : pfpUrl}
                                        className="w-[150px]"
                                        alt="Profile Picture"
                                    />
                                    <label className="formbutton text-center">
                                        <input
                                            className='hidden'
                                            type="file"
                                            name="pfpUpload"
                                            key={reset}
                                            onChange={(event) => {
                                                console.log(event.target.files[0]);
                                                setSelectedImage(event.target.files[0]);
                                            }}
                                        />
                                        Upload
                                    </label>
                                    {
                                        selectedImage && 
                                            <button className="formbutton" onClick={() => setSelectedImage(null)}>Reset</button>
                                    }
                                </div>

                                <div className="flex flex-col ml-12 w-full">
                                    <div className='text-[24px] text-fontgray pb-1.5'>
                                        Name: {user.firstName + " " + user.lastName}
                                    </div>
                                    <div className='text-fontgray'>
                                        <div>Description:</div>
                                        <textarea 
                                            className="formlabel border-2 border-fontgray p-2 resize-none !outline-none"
                                            id="description" 
                                            name="description" 
                                            rows="5" 
                                            cols="100" 
                                            maxLength="300"
                                            placeholder={user.description}
                                            value={description} 
                                            onChange={(e) => setDescription(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div className='w-fit flex flex-col justify-between'>
                                    <div className="flex flex-row-reverse">
                                    <IconCheck stroke={2} color='#70cc66' onClick={(e) => { e.preventDefault(); handleSave(); }} />
                                    </div>
                                    {
                                        canDelete && 
                                            <button className="formbutton bg-errorred"
                                                onClick={(e) => {e.preventDefault(); handleDeleteProfile();}}>
                                                Delete User
                                            </button>
                                    }
                                </div>
                            </>
                    }
                </div>
                {/* Student view - includes their reservations  */}
                {user.role === "student" && (
                <div className="mt-4">
                    <table className="table-auto w-full">
                        <thead className="shadow shadow-sm">
                            <tr className="bg-bgblue">
                                {columnHeader.map((column, i) => (
                                    <th key={i} className="text-left font-semibold py-2 px-4">{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reservationVisuals}
                        </tbody>
                    </table>
                </div>
            )}
            </div>
        </>
    );
}
