import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider.jsx';

export default function LoginOrHome() {
    const session = useAuth();
    if (!session.user) {
        return <Navigate to="login"/>
    }

    return <Navigate to="home"/>
}