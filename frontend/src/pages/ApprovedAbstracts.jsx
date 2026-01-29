import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, FileText, Download } from 'lucide-react';
import './ApprovedAbstracts.css';

const ApprovedAbstracts = () => {
    const navigate = useNavigate();
    const [abstracts, setAbstracts] = useState([]);
    const [filteredAbstracts, setFilteredAbstracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState('All');

    const username = localStorage.getItem('username') || 'Coordinator';

    useEffect(() => {
        fetchAbstracts();
    }, []);

    useEffect(() => {
        filterAbstracts();
    }, [selectedDept, abstracts]);

    const fetchAbstracts = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/approved-abstracts/');
            setAbstracts(response.data);
        } catch (error) {
            console.error('Error fetching approved abstracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAbstracts = () => {
        if (selectedDept === 'All') {
            setFilteredAbstracts(abstracts);
        } else {
            setFilteredAbstracts(abstracts.filter(a => a.department === selectedDept));
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div className="loading-state">
            <div className="loader"></div>
            <p>Loading Approved Abstracts...</p>
        </div>
    );

    return (
        <div className="abstracts-page">
            <header className="abstracts-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')} title="Back to Dashboard">
                        <ChevronLeft size={24} />
                    </button>
                    <h1>Approved Project Abstracts</h1>
                </div>
                <div className="header-right">
                    <span style={{ fontWeight: 600 }}>{username}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="abstracts-content">
                <div className="page-title-section">
                    <h2>Approved Project Abstracts</h2>
                    <p>List of all guide-approved project abstracts</p>
                </div>

                <div className="filter-section">
                    <label htmlFor="dept-filter">Filter by Department:</label>
                    <select
                        id="dept-filter"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        <option value="All">All Departments</option>
                        <option value="MCA">MCA</option>
                        <option value="IMCA">IMCA</option>
                    </select>
                </div>

                <div className="table-card">
                    {filteredAbstracts.length === 0 ? (
                        <div className="empty-state">
                            <p>No approved abstracts available for the selected department.</p>
                        </div>
                    ) : (
                        <div className="abstracts-table-wrapper">
                            <table className="abstracts-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Register Number</th>
                                        <th>Department</th>
                                        <th>Approved Abstract</th>
                                        <th>Guide Name</th>
                                        <th>Approval Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAbstracts.map((abstract, idx) => (
                                        <tr key={idx}>
                                            <td>{abstract.student_name}</td>
                                            <td>{abstract.register_number}</td>
                                            <td>
                                                <span className="dept-badge">{abstract.department}</span>
                                            </td>
                                            <td>
                                                {abstract.abstract_url ? (
                                                    <a
                                                        href={`http://localhost:8000${abstract.abstract_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="abstract-link"
                                                    >
                                                        <FileText size={16} />
                                                        View PDF
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>Not Available</span>
                                                )}
                                            </td>
                                            <td>{abstract.guide_name}</td>
                                            <td>{abstract.approval_date}</td>
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

export default ApprovedAbstracts;
