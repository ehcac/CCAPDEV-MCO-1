import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../AuthProvider.jsx';
import logoURL from '../assets/logo.png';

export default function Navbar() {
    const auth = useAuth()
    const navigate = useNavigate()

    return (
        <div className="fixed top-0 h-16 w-full overflow-hidden bg-fieldgray z-[999] items-center">
            <div className="flex flex-row justify-between h-full select-none">
                <div className="flex items-center justify-start font-sans text-fontgray text-lg font-semibold"> 
                    <Link to={"/home"}>
                        <img
                            src={logoURL}
                            className="w-[140px]"
                            alt="BookLabs logo"
                        /> 
                    </Link>
                    <div className="pr-4 hover:text-linkblue cursor-pointer"
                        onClick={() => {navigate("/home")}}>
                        Reserve
                    </div>
                    {
                        auth.user.role == "technician" ? 
                            <div className="pr-4 hover:text-linkblue cursor-pointer"
                                onClick={() => {navigate("/reservations")}}>
                                Reservations
                            </div>
                        : <></>
                    }
                    <div className="pr-4 hover:text-linkblue cursor-pointer"
                        onClick={() => {
                            if (auth.user.role == "student")
                                navigate("/profile/student")
                            else if (auth.user.role == "technician")
                                navigate("/profile/lab")
                            }}>
                        Profile
                    </div>
                    <div className="pr-4 hover:text-linkblue cursor-pointer"
                        onClick={() => {navigate("/users")}}>
                        Users
                    </div>
                </div>
                <div className="flex items-center justify-end col-start-3 mr-5 text-lg hover:text-linkblue cursor-pointer"
                    onClick={(e) => {auth.logoutAction(); navigate("/login");}}>
                    logout
                </div>
            </div>
        </div>
    );
}