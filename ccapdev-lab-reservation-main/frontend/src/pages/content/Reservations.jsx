import { useAuth } from '../../AuthProvider.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconEdit, IconTrash } from '@tabler/icons-react';

export default function Reservations() {
    const navigate = useNavigate();
    
    const [reservations, setReservations] = useState([null]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const auth = useAuth();

    const columnHeader = [
        { label: "Name", accessor: "fullName" },
        { label: "Laboratory", accessor: "labID" },
        { label: "Seat", accessor: "seatNumber" }, 
        { label: "Reservation Date", accessor: "formattedReservationDate" },
        { label: "Timeslot", accessor: "timeSlot" },
        { label: "Time of Request", accessor: "formattedCreatedAt" },
        { label: "", accessor: "edit" },
        { label: "", accessor: "cancel" }
    ];

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/reservations`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();

                const formattedData = data.map((reservation) => ({
                    ...reservation,
                    fullName: `${reservation.userDetails.firstName} ${reservation.userDetails.lastName}`,
                    formattedReservationDate: new Date(reservation.startTime).toLocaleString("en-US", { 
                        month: "long",
                        day: "2-digit",
                        year: "numeric"
                    }),
                    timeSlot: `${new Date(reservation.startTime).toLocaleTimeString("en-US", { 
                        hour12: false, 
                        hour: "2-digit", 
                        minute: "2-digit",
                        timeZone: "Asia/Singapore"
                    })} - ${new Date(reservation.endTime).toLocaleTimeString("en-US", { 
                        hour12: false, 
                        hour: "2-digit", 
                        minute: "2-digit",
                        timeZone: "Asia/Singapore"
                    })}`,
                    formattedCreatedAt: new Date(reservation.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour12: false, 
                        hour: "2-digit", 
                        minute: "2-digit",
                        timeZone: "Asia/Singapore"
                    })
                }));

                setReservations(formattedData);
            } catch (err) {
                console.error("Error fetching reservations:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [auth.user]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    const header = columnHeader.map((col) => (
        <th key={col.accessor} className="font-semibold py-1 px-2">
            {col.label}
        </th>
    ));

    const reservationVisuals = reservations.map((reservation, index) => {
        const currentTime = new Date(); // Get current time
        const reservationStartTime = new Date(reservation.startTime); // Convert stored startTime

        // Compute the threshold: reservation start time + 10 minutes
        const tenMinutesAfterStart = new Date(reservationStartTime.getTime() + 10 * 60 * 1000);

        // Compare current time with threshold
        const deleteable = currentTime >= tenMinutesAfterStart;

//fdkdl
        console.log("current time: ", currentTime, " reservationTime: ", reservationStartTime, "| ", deleteable);
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
                <td>
                    {deleteable && (
                        <IconTrash 
                            stroke={2} 
                            color="#cc5f5f" 
                            className="cursor-pointer" 
                            onClick={(e) =>  { e.preventDefault(); handleDelete(reservation._id); }} 
                        />
                    )}
                </td>
            </tr>
        );
    });

    const handleDelete = async (reservationId) => {
        if (!window.confirm("Are you sure you want to delete this reservation?")) {
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:5000/api/reservations/delete/${reservationId}`, {
                method: "DELETE",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.statusText}`);
            }
    
            // Update UI by filtering out the deleted reservation
            setReservations((prevReservations) =>
                prevReservations.filter((reservation) => reservation._id !== reservationId)
            );
    
            alert("Reservation deleted successfully.");
        } catch (error) {
            console.error("Error deleting reservation:", error);
            alert(`Failed to delete reservation: ${error.message}`);
        }
    };    

    return (
        <div className="flex flex-col border-2 border-bgblue mt-4 p-4 rounded-lg">
            <div className="font-bold text-[24px] text-fontgray pb-1.5">
                Reservations
            </div>
            {loading ? <p>Loading reservations...</p> : error ? <p className="text-red-500">Error: {error}</p> : (
                <table className="w-full table-auto my-3 rounded-sm bg-white border-solid border-2 border-bgblue text-left text-fontgray border-separate border-spacing-0">
                    <thead className="shadow shadow-sm">
                        <tr className="bg-bgblue">{header}</tr>
                    </thead>
                    <tbody>{reservationVisuals}</tbody>
                </table>
            )}
        </div>
    );
}