import { useState } from 'react';
import { redirect, useLocation, Outlet } from 'react-router-dom';

import { SnackbarProvider, closeSnackbar } from 'notistack';

import Navbar from '../components/Navbar.jsx';

import { useAuth } from '../AuthProvider.jsx';

export default function Page() {
    const session = useAuth();

    return (
        <SnackbarProvider 
            maxSnack={1}
            action={(snackbarId) => {
                <button onClick={() => closeSnackbar(snackbarId)}>
                    Dismiss
                </button>
            }}
        >
            <div className="relative h-full w-full overflow-x-hidden">
                <div className="h-screen flex flex-col items-center">
                    <Navbar/>
                    <div className="mt-16 py-12 px-10 h-full w-full overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-[#dbd9d9] scrollbar-thumb-[#dbd9d9] scrollbar-hover-fontgray active:scrollbar-thumb-fontgray scrollbar-track-white">
                        <Outlet />
                    </div>
                </div>
            </div>
        </SnackbarProvider>
    );
}