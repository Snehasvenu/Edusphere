import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserX } from 'lucide-react';
import './AllocatedGuide.css';

const AllocatedGuide = () => {
    const [guideDetails, setGuideDetails] = useState({
        name: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [isAllocated, setIsAllocated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGuideDetails = async () => {
            try {
                // Get token from local storage
                const token = localStorage.getItem('token');

                // Configure headers for authentication
                const config = {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                };

                // Call API without email param, relying on token auth
                const response = await axios.get(
                    `http://localhost:8000/api/profile/?t=${Date.now()}`,
                    config
                );

                const data = response.data;
                const notAllocated = !data.guide_name || data.guide_name === 'Not Yet Allotted';

                if (notAllocated) {
                    setIsAllocated(false);
                } else {
                    setIsAllocated(true);
                    setGuideDetails({
                        name: data.guide_name,
                        email: data.guide_email || 'Email not available'
                    });
                }
            } catch (error) {
                console.error("Error fetching guide details:", error);

                // Optional: Redirect to login if 401
                if (error.response && error.response.status === 401) {
                    // navigate('/login');
                }

                setIsAllocated(false);
            } finally {
                setLoading(false);
            }
        };

        fetchGuideDetails();
    }, [navigate]);

    if (loading) {
        return (
            <div className="allocated-guide-container">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Fetching guide details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="allocated-guide-container">
            <header className="allocated-guide-header">
                <h1>Allocated Guide</h1>
                <p className="subtitle">Allocated by Project Coordinator</p>
            </header>

            {isAllocated ? (
                <div className="guide-details-card">
                    <div className="card-content">
                        <div className="detail-item">
                            <span className="detail-label">Guide Name</span>
                            <span className="detail-value">{guideDetails.name}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{guideDetails.email}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="no-allocation-card">
                    <UserX size={48} color="#94a3b8" />
                    <p className="friendly-message">Guide not yet allocated by Project Coordinator.</p>
                </div>
            )}

            <button className="back-dashboard-btn" onClick={() => navigate('/student-dashboard')}>
                <ChevronLeft size={20} />
                Back to Dashboard
            </button>
        </div>
    );
};

export default AllocatedGuide;
