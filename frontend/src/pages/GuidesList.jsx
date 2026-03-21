import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, UserCheck, Search, Mail, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GuidesListGrid.css'; // CHANGED: Importing the new CSS file

const GuidesList = () => {
    const navigate = useNavigate();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchGuides();
    }, []);

    const fetchGuides = async () => {
        try {
            // Add timestamp to prevent API caching
            const response = await axios.get(`http://localhost:8000/api/guides/?t=${Date.now()}`);
            setGuides(response.data);
        } catch (error) {
            console.error('Error fetching guides:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGuides = guides.filter(guide => {
        return (guide.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (guide.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    });

    return (
        <div className="guides-list-grid-page">
            <div className="guides-list-container">
                <header className="page-header-grid">
                    <div className="header-top-row">
                        <button className="back-btn-grid" onClick={() => navigate('/coordinator-dashboard')}>
                            <ArrowLeft size={18} /> Back to Dashboard
                        </button>
                    </div>
                    <div className="header-title-zone">
                        <h1><UserCheck size={36} color="#000" /> All Guides</h1>
                        <p className="subtitle">Managing {filteredGuides.length} project guides</p>
                    </div>
                </header>

                <div className="filters-grid-section">
                    <div className="search-box-grid">
                        <Search size={20} color="#6b7280" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>Loading guides...</p>
                    </div>
                ) : (
                    <div className="guides-cards-grid">
                        {filteredGuides.map(guide => (
                            <div key={guide.id} className="guide-card-item">
                                <div className="card-header-grid">
                                    <div className="avatar-grid">
                                        {guide.name ? guide.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="guide-info-grid">
                                        <h3>{guide.name}</h3>
                                        <span className="role-tag">Project Guide</span>
                                    </div>
                                </div>
                                <div className="card-body-grid">
                                    <div className="grid-info-row">
                                        <Mail size={18} />
                                        <span>{guide.email}</span>
                                    </div>
                                    <div className="grid-info-row">
                                        <Users size={18} />
                                        <span>{guide.student_count} Students</span>
                                    </div>
                                </div>
                                {guide.students.length > 0 && (
                                    <div className="card-footer-grid">
                                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px' }}>ASSIGNED STUDENTS</p>
                                        <ul className="student-list-grid">
                                            {guide.students.map(student => (
                                                <li key={student.id}>• {student.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredGuides.length === 0 && (
                    <div className="empty-state">
                        <h3>No guides found</h3>
                        <p>Try adjusting your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuidesList;
