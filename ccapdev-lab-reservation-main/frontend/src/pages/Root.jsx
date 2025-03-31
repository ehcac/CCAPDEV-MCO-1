import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider.jsx';

export default function Root() {

    return (
        <Outlet />
    )
}