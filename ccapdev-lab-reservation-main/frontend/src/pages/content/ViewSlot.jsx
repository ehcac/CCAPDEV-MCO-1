import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import { IconTrash } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { io } from 'socket.io-client';

export default function Reservations() {
    const { enqueueSnackbar } = useSnackbar();
    const auth = useAuth();
    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        fetchReservations();
        
        // 🔥 Connect to WebSocket server
        const socket = io('http://localhost:5000');

        // 🔥 Listen for reservation updates
        socket.on('updateReservations', (data) => {
            console.log('Received real-time update:', data);
            fetchReservations(); // Refresh reservations when updated
        });

        return () => socket.disconnect(); // Cleanup on unmount
    }, []);

    const fetchReservations = async () => {
        try {
            const apiEndpoint = auth.user.role === 'technician' ? '/api/reservations/technician' : '/api/reservations/user';
            const response = await axios.get(`http://localhost:5000${apiEndpoint}`);
            setReservations(response.data);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    };

    const handleDelete = async (reservationId) => {
        if (!window.confirm('Are you sure you want to delete this reservation?')) return;
        try {
            const apiEndpoint = auth.user.role === 'technician' ? '/api/remove-reservation/technician' : '/api/remove-reservation/user';
            await axios.delete(`http://localhost:5000${apiEndpoint}/${reservationId}`);
            enqueueSnackbar('Reservation removed successfully.', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error removing reservation.', { variant: 'error' });
            console.error('Delete error:', error);
        }
    };

    return (
        <div className='flex flex-col border-2 border-bgblue mt-4 p-4 rounded-lg'>
            <h2 className='font-bold text-2xl'>Reservations</h2>
            <table className='w-full table-auto my-3 rounded-sm bg-white border-solid border-2 border-bgblue text-left'>
                <thead>
                    <tr className='bg-bgblue'>
                        <th>User</th>
                        <th>Room</th>
                        <th>Seat</th>
                        <th>Reservation Date</th>
                        <th>Timeslot</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map((res) => (
                        <tr key={res._id} className='odd:bg-white even:bg-fieldgray hover:bg-bgpink'>
                            <td>{res.userEmail}</td>  {/* ✅ Now displays user's email */}
                            <td>{res.labName}</td>   {/* ✅ Now displays lab name */}
                            <td>{res.seatNumber || 'N/A'}</td>
                            <td>{new Date(res.startTime).toLocaleDateString()}</td>
                            <td>{new Date(res.startTime).toLocaleTimeString()} - {new Date(res.endTime).toLocaleTimeString()}</td>
                            <td>
                                {auth.user.role === 'technician' && (
                                    <IconTrash stroke={2} color='#cc5f5f' className='cursor-pointer' onClick={() => handleDelete(res._id)} />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}