import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

import pfp1 from '../../assets/pfp1.jpg';

export default function Profile() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [pfpUrl, setPfpUrl] = useState(pfp1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL;


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api/profile/user/${id}`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                
                const data = await response.json();
                setUser(data);
                setPfpUrl(data.profilePicture || pfp1);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, [id]);

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!user) return <p>User not found</p>;

    return (
        <div className="flex flex-col border-2 border-bgblue p-4 rounded-lg">
            <div className="flex flex-row">
                <img src={pfpUrl} className="w-[150px]" alt="Profile Picture" />
                <div className="flex flex-col ml-12 w-full">
                    <div className='text-[24px] text-fontgray pb-1.5'>
                        Name: {user.firstName + " " + user.lastName}
                    </div>
                    <div className='text-fontgray'>
                        Description: {user.description}
                    </div>
                </div>
            </div>
        </div>
    );
}