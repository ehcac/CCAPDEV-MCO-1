import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

export default function ProtectedRoute() {

    const session = useAuth();
    if (!session.user) {
        return <Navigate to="/login"/>
    }

    return (
        <Outlet />
    )
}