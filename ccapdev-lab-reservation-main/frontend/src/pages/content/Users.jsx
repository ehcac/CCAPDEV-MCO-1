import { useAuth } from '../../AuthProvider.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import pfp2 from '../../assets/pfp1.jpg';
import { IconSearch } from '@tabler/icons-react';

export default function Users(){
    const navigate = useNavigate();
    const auth = useAuth();

    const [publicProfiles, setProfiles] = useState([]);
    const [profilesVisuals, setProfilesVisuals] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/users`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                //console.log("Fetched Users:", data);  // Debugging
                setProfiles(data || []);  
            } catch (err) {
                console.error("Error fetching profiles:", err);
                setError(err.message);
            }
        };
    
        fetchProfiles();
    }, []);
    

    const filteredProfiles = publicProfiles.filter(user => 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-y-3 p-4">
            <div className="relative w-full max-w-md mx-auto">
                <input 
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <IconSearch className="absolute left-3 top-2.5 text-gray-500" size={20} />
            </div>

            {error && <div className="text-red-500">Error: {error}</div>}
            
            {filteredProfiles.length > 0 ? (
                filteredProfiles.map((user, index) => (
                    <div 
                        key={index} 
                        className="flex flex-col border-2 border-bgblue p-4 rounded-lg mb-4"
                    >
                        <div className="flex flex-row">
                            <img 
                                src={user.profilePicture || pfp2} 
                                className="w-[150px] h-[150px] object-cover rounded-full"
                                alt="Profile Picture"
                            />

                            <div className="flex flex-col ml-12 w-full">
                                <div className='text-[24px] text-fontgray pb-1.5'>
                                    Name: {user.firstName} {user.lastName}
                                </div>
                                <div className='text-fontgray'>
                                    Description: {user.description || "No description available"}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-gray-500 text-center mt-4">No users found.</div>
            )}
        </div>
    );
}