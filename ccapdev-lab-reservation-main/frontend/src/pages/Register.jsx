import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoURL from '../assets/logo.png';
import { IconEye, IconEyeClosed } from '@tabler/icons-react';

import { useAuth } from '../AuthProvider.jsx';

export default function RegisterPage() {
    const navigate = useNavigate();
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setVisible] = useState(false);
    
    const auth = useAuth();
    
    const handleSubmit = (e) => {
        e.preventDefault();

        auth.registerAction(firstName, lastName, email, password, confirmPassword);
    };

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div className="h-screen flex flex-col items-center justify-center">
                <img
                    src={logoURL}
                    className="w-[500px]"
                    alt="BookLabs logo"
                />
                <div className="flex flex-col items-center gap-2">
                    <form onSubmit={handleSubmit}>
                        <div className="mt-10 flex flex-col items-center justify-center space-y-4">
                            
                            {/* First Name */}
                            <div className="w-full">
                                <label className="flex w-full text-sm font-light text-fontgray">First Name</label>
                                <input
                                    className="block w-60 rounded-md py-2 pl-3 text-sm font-semibold bg-fieldgray outline-none"
                                    type="text"
                                    value={firstName}
                                    required
                                    onChange={(e) => setFirstName(e.currentTarget.value)}
                                />
                            </div>

                            {/* Last Name */}
                            <div className="w-full">
                                <label className="flex w-full text-sm font-light text-fontgray">Last Name</label>
                                <input
                                    className="block w-60 rounded-md py-2 pl-3 text-sm font-semibold bg-fieldgray outline-none"
                                    type="text"
                                    value={lastName}
                                    required
                                    onChange={(e) => setLastName(e.currentTarget.value)}
                                />
                            </div>

                            {/* Email */}
                            <div className="w-full">
                                <label className="flex w-full text-sm font-light text-fontgray">Email</label>
                                <input
                                    className="block w-60 rounded-md py-2 pl-3 text-sm font-semibold bg-fieldgray outline-none"
                                    type="email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                />
                            </div>

                            {/* Password */}
                            <div className="w-full relative">
                                <label className="flex w-full text-sm font-light text-fontgray">Password</label>
                                <input
                                    className="block w-60 rounded-md py-2 pl-3 pr-8 text-sm font-semibold bg-fieldgray outline-none"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.currentTarget.value)}
                                />
                                {showPassword ? (
                                    <IconEyeClosed 
                                        color='#4a4747' 
                                        size={20} 
                                        className="absolute right-2 top-7" 
                                        onClick={() => setVisible(!showPassword)} 
                                    />
                                ) : (
                                    <IconEye 
                                        color='#4a4747' 
                                        size={20} 
                                        className="absolute right-2 top-7" 
                                        onClick={() => setVisible(!showPassword)} 
                                    />
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="w-full">
                                <label className="flex w-full text-sm font-light text-fontgray">Confirm Password</label>
                                <input
                                    className="block w-60 rounded-md py-2 pl-3 text-sm font-semibold bg-fieldgray outline-none"
                                    type="password"
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-1.5 mt-6 rounded-full bg-linkblue text-white font-bold text-[20px] shadow hover:shadow-md"
                            >
                                REGISTER
                            </button>

                            <Link to="/login" className="text-sm text-linkblue">Already have an account? Login here</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
