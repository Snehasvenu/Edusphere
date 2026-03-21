import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Copy } from 'lucide-react';
import './Duplicates.css';

const Duplicates = () => {
    const navigate = useNavigate();
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDuplicates();
    }, []);

    const fetchDuplicates = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/duplicate-check/?threshold=80');
            setDuplicates(response.data);
        } catch (error) {
            console.error('Error fetching duplicates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <p>Loading duplicate submissions...</p>
            </div>
        );
    }

    return (
        <div className="duplicates-page">
            <header className="abstracts-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')} title="Back to Dashboard">
                        <ChevronLeft size={24} />
                    </button>
                    <h1>Duplicate Abstract Alerts</h1>
                </div>
                <div className="header-right">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="duplicates-content">
                <div className="page-title-section">
                    <h2>Detected High-Similarity Abstracts</h2>
                    <p>Only submissions with similarity ≥ 80% are shown.</p>
                </div>
                <div className="table-card">
                    {duplicates.length === 0 ? (
                        <div className="empty-state">
                            <p>No duplicates found. Great news!</p>
                        </div>
                    ) : (
                        <div className="abstracts-table-wrapper">
                            <table className="abstracts-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Project Title</th>
                                        <th>Similar Existing Title</th>
                                        <th>Similarity %</th>
                                        <th>Guide</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duplicates.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.student_name} <br/><small>{item.student_email}</small></td>
                                            <td>{item.project_title || 'N/A'}</td>
                                            <td>{item.duplicate_project_title || 'N/A'}</td>
                                            <td>{item.similarity_score}%</td>
                                            <td>{item.guide_name}</td>
                                            <td>{item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Duplicates;
