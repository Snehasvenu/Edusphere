import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Users, Search, Mail, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './StudentsList.css';

const StudentsList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('role');
        const token = localStorage.getItem('token');

        console.log('User role from localStorage:', role);
        console.log('User token from localStorage:', token);

        // If no role or token, redirect to login
        if (!role || !token) {
            console.log('No authentication found, redirecting to login');
            navigate('/login');
            return;
        }

        setUserRole(role);
        fetchStudents(role);
    }, [navigate]);

    const fetchStudents = async (role) => {
        try {
            let response;
            const normalizedRole = role?.toLowerCase();
            console.log('Normalized role:', normalizedRole);

            if (normalizedRole === 'guide') {
                // Fetch only allocated students for guides
                const email = localStorage.getItem('username');
                console.log('Fetching allocated students for guide:', email);
                response = await axios.get(`http://localhost:8000/api/alotted-students/?email=${email}`);
                console.log('Allocated students response:', response.data);
            } else {
                // Fetch all students for coordinators
                console.log('Fetching all students for coordinator');
                response = await axios.get('http://localhost:8000/api/students/');
                console.log('All students response:', response.data);
            }
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesDepartment = !filterDepartment || student.department === filterDepartment;

        return matchesSearch && matchesDepartment;
    });

    const departments = [...new Set(students.map(s => s.department).filter(d => d && d !== 'N/A'))];

    return (
        <div className="students-list-page">
            <header className="page-header">
                <button
                    className="back-btn"
                    onClick={() => navigate(userRole?.toLowerCase() === 'guide' ? '/guide-dashboard' : '/coordinator-dashboard')}
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>
                        <Users size={32} />
                        {userRole?.toLowerCase() === 'guide' ? 'My Assigned Students' : 'All Students'}
                    </h1>
                    <p className="subtitle">Total: {filteredStudents.length} students</p>
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
                <select
                    className="department-filter"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading students...</p>
                </div>
            ) : (
                <div className="students-grid">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="student-card">
                            <div className="card-header">
                                <div className="avatar">
                                    {student.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="student-info">
                                    <h3>{student.name}</h3>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <Mail size={16} />
                                    <span className="info-value">{student.email}</span>
                                </div>
                                {student.department && student.department !== 'N/A' && (
                                    <div className="info-row">
                                        <BookOpen size={16} />
                                        <span className="info-label">Department:</span>
                                        <span className="info-value">{student.department}</span>
                                    </div>
                                )}
                            </div>
                            {userRole?.toLowerCase() !== 'guide' && (
                                <div className="card-footer">
                                    {student.guide ? (
                                        <span className="guide-badge assigned">
                                            Guide: {student.guide.name}
                                        </span>
                                    ) : (
                                        <span className="guide-badge unassigned">
                                            No Guide Assigned
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredStudents.length === 0 && (
                <div className="empty-state">
                    <Users size={64} />
                    <h3>No students found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default StudentsList;
