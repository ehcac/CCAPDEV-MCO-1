import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        return JSON.parse(localStorage.getItem("user")) ?? null;
    });
    const [errorMessage, setErrorMessage] = useState(""); 
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;


    const loginAction = async (username, password, remember) => {
        try {
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: username, password }) 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || "Invalid credentials");
            }

            const data = await response.json();
            console.log("Login response data:", data);

            if (!data.user) {
                console.error("No user data received!");
                return;
            }

            setUser(data.user);
            console.log("User set in state:", data.user);

            if (remember) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);
            }
            sessionStorage.setItem("user", JSON.stringify(data.user));
            sessionStorage.setItem("token", data.token);
            navigate("/home");
        } catch (error) {
            console.error("Login error:", error);
            alert(error.message);
        }
    };

    const registerAction = async (firstName, lastName, email, password, confirmPassword) => { 
        console.log("Sending request with:", { firstName, lastName, email, password, confirmPassword });

        try {
            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password, confirmPassword})
            });

            const data = await response.json(); 

            if (!response.ok) {
                throw new Error(data?.message || "Email has been registered already");
            }

            alert(data.message);
            navigate("/login");
        } catch (error) {
            console.error("Registration error:", error);
            setErrorMessage(error.message);
            alert(error.message);
        }
    };

    const logoutAction = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loginAction, registerAction, logoutAction }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

export const useAuth = () => {
    return useContext(AuthContext);
};
