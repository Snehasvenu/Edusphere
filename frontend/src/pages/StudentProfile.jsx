import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Bell,
    UserCheck,
    Mail,
    BookOpen,
    User,
    LogOut,
    CircleUser
} from 'lucide-react';
import './StudentProfile.css';

const StudentProfile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        department: '',
        guide_name: '',
        guide_email: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Student';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const email = localStorage.getItem('username');
                // Add timestamp to prevent caching
                const response = await axios.get(`http://localhost:8000/api/profile/?email=${email}&t=${new Date().getTime()}`);
                console.log('Profile Data Loaded:', response.data);
                setProfile(response.data);
            } catch (err) {
                setError('Failed to load profile information');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]); // Refetch on navigation

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div className="loading-state">
            <div className="loader"></div>
            <p>Fetching Guide Details...</p>
        </div>
    );

    return (
        <div className="profile-container">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <header className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/student-dashboard')} title="Back to Dashboard">
                        <ChevronLeft size={24} />
                    </button>
                    <h1>Allocated Guide</h1>
                </div>
                <div className="header-right">
                    <div className="user-profile">
                        <CircleUser size={20} />
                        <span>{username}</span>
                    </div>
                    <button className="icon-btn">
                        <Bell size={20} />
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="profile-content">
                <div className="welcome-banner">
                    <h2>Mentor Information</h2>
                    <p>Details of your assigned guide for project coordination.</p>
                </div>

                <div className="guide-presentation">
                    <div className={`guide-card ${profile.guide_name === 'Not Yet Allotted' ? 'unassigned-state' : 'active'}`}>
                        <div className="card-accent"></div>
                        <div className="guide-icon-large">
                            <UserCheck size={56} />
                        </div>
                        <div className="guide-main-info">
                            <span className="info-label">
                                {profile.guide_name === 'Not Yet Allotted' ? 'Status' : 'Current Assigned Guide'}
                            </span>
                            <h3 className="guide-name">
                                {profile.guide_name}
                            </h3>
                            {profile.guide_name !== 'Not Yet Allotted' && profile.guide_email && (
                                <div className="guide-contact">
                                    <Mail size={20} />
                                    <span>{profile.guide_email}</span>
                                </div>
                            )}
                        </div>
                        <div className="guide-status-badge">
                            <span className={`status-pill ${profile.guide_name === 'Not Yet Allotted' ? 'unassigned' : 'assigned'}`}>
                                {profile.guide_name === 'Not Yet Allotted' ? 'Pending' : 'Allotted'}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentProfile;
