import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, UserCheck, Search, Mail, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GuidesList.css';

const GuidesList = () => {
    const navigate = useNavigate();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

    useEffect(() => {
        fetchGuides();
    }, []);

    const fetchGuides = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/guides/');
            setGuides(response.data);
        } catch (error) {
            console.error('Error fetching guides:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGuides = guides.filter(guide => {
        const matchesSearch =
            (guide.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (guide.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    return (
        <div className="guides-list-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="header-content">
                    <h1><UserCheck size={32} /> All Guides</h1>
                    <p className="subtitle">Total: {filteredGuides.length} guides</p>
                </div>
            </header>

            <div className="filters-section">
                <div className="search-box">
                    <Search size={20} />
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
                    <div className="spinner"></div>
                    <p>Loading guides...</p>
                </div>
            ) : (
                <div className="guides-grid">
                    {filteredGuides.map(guide => (
                        <div key={guide.id} className="guide-card">
                            <div className="card-header">
                                <div className="avatar">
                                    {guide.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="guide-info">
                                    <h3>{guide.name}</h3>
                                    <span className="role-badge">Project Guide</span>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <Mail size={16} />
                                    <span className="info-value">{guide.email}</span>
                                </div>
                                <div className="info-row">
                                    <Users size={16} />
                                    <span className="info-value">{guide.student_count} Students Assigned</span>
                                </div>
                            </div>
                            {guide.students.length > 0 && (
                                <div className="card-footer">
                                    <p className="students-label">Assigned Students:</p>
                                    <ul className="students-list">
                                        {guide.students.map(student => (
                                            <li key={student.id}>
                                                {student.name}
                                            </li>
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
                    <UserCheck size={64} />
                    <h3>No guides found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default GuidesList;
