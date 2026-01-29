import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Users, UserCheck, Shuffle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GuideAllocation.css';

const GuideAllocation = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [guides, setGuides] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedGuide, setSelectedGuide] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, guidesRes] = await Promise.all([
                axios.get('http://localhost:8000/api/students/'),
                axios.get('http://localhost:8000/api/guides/')
            ]);
            setStudents(studentsRes.data);
            setGuides(guidesRes.data);
        } catch (error) {
            showMessage('Error fetching data', 'error');
        }
    };

    const handleManualAssign = async () => {
        if (!selectedStudent || !selectedGuide) {
            showMessage('Please select both student and guide', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/assign-guide/', {
                student_id: selectedStudent,
                guide_id: selectedGuide
            });
            showMessage(response.data.message, 'success');
            setSelectedStudent('');
            setSelectedGuide('');
            fetchData(); // Refresh data
        } catch (error) {
            showMessage(error.response?.data?.error || 'Assignment failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAllocate = async () => {
        if (!window.confirm('Are you sure you want to auto-allocate all unassigned students?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/auto-allocate-guides/', {});
            showMessage(response.data.message, 'success');
            fetchData(); // Refresh data
        } catch (error) {
            showMessage(error.response?.data?.error || 'Auto-allocation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const unassignedStudents = students.filter(s => !s.guide);
    const assignedStudents = students.filter(s => s.guide);

    return (
        <div className="guide-allocation">
            <header className="allocation-header">
                <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <h1>Guide Allocation</h1>
            </header>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="allocation-container">
                {/* Manual Assignment Section */}
                <section className="assignment-section">
                    <h2><Users size={24} /> Manual Assignment</h2>
                    <div className="assignment-form">
                        <div className="form-group">
                            <label>Select Unassigned Student</label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">-- Select Student --</option>
                                {unassignedStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} {student.department && student.department !== 'N/A' ? `- Dept: ${student.department}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Guide</label>
                            <select
                                value={selectedGuide}
                                onChange={(e) => setSelectedGuide(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">-- Select Guide --</option>
                                {guides.map(guide => (
                                    <option key={guide.id} value={guide.id}>
                                        {guide.name} (Currently: {guide.student_count} students)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="assign-btn"
                            onClick={handleManualAssign}
                            disabled={loading || !selectedStudent || !selectedGuide}
                        >
                            <UserCheck size={20} />
                            {loading ? 'Assigning...' : 'Assign Guide'}
                        </button>
                    </div>
                </section>

                {/* Auto-Allocation Section */}
                <section className="auto-allocation-section">
                    <h2><Shuffle size={24} /> Auto-Allocation</h2>
                    <p>Automatically assign all unassigned students to guides using round-robin distribution.</p>
                    <div className="stats">
                        <div className="stat-card">
                            <span className="stat-number">{unassignedStudents.length}</span>
                            <span className="stat-label">Unassigned Students</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{guides.length}</span>
                            <span className="stat-label">Available Guides</span>
                        </div>
                    </div>
                    <button
                        className="auto-allocate-btn"
                        onClick={handleAutoAllocate}
                        disabled={loading || unassignedStudents.length === 0}
                    >
                        <Shuffle size={20} />
                        {loading ? 'Allocating...' : 'Auto-Allocate All'}
                    </button>
                </section>

                {/* Students Table */}
                <section className="table-section">
                    <h2><Users size={24} /> All Students ({students.length})</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Assigned Guide</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.department && student.department !== 'N/A' ? student.department : '-'}</td>
                                        <td>{student.guide ? student.guide.name : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${student.guide ? 'assigned' : 'unassigned'}`}>
                                                {student.guide ? 'Assigned' : 'Unassigned'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Guides Table */}
                <section className="table-section">
                    <h2><UserCheck size={24} /> All Guides ({guides.length})</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Student Count</th>
                                    <th>Assigned Students</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guides.map(guide => (
                                    <tr key={guide.id}>
                                        <td>{guide.name}</td>
                                        <td>
                                            <span className="count-badge">{guide.student_count}</span>
                                        </td>
                                        <td>
                                            {guide.students.length > 0 ? (
                                                <ul className="student-list">
                                                    {guide.students.map(s => (
                                                        <li key={s.id}>{s.name}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="no-students">No students assigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GuideAllocation;
