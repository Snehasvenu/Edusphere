import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Users, UserCheck, Shuffle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
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
                axios.get('http://localhost:8000/api/students/?t=' + Date.now()),
                axios.get('http://localhost:8000/api/guides/?t=' + Date.now())
            ]);
            setStudents(studentsRes.data);
            setGuides(guidesRes.data);
        } catch (error) {
            showMessage('Error fetching data', 'error');
        }
    };

    const handleAssign = async (studentId, guideId) => {
        if (!studentId || !guideId) {
            showMessage('Please select both student and guide', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/assign-guide/', {
                student_id: studentId,
                guide_id: guideId
            });
            showMessage(response.data.message, 'success');
            setSelectedStudent('');
            setSelectedGuide('');
            fetchData();
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
            fetchData();
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

    // Filter for the main assignment dropdown (Unassigned + currently selected if we were editing, but here we just show Unassigned)
    // We can add a "Reassign" feature later, but for now we focus on the main flow. 

    return (
        <div className="guide-allocation">
            <header className="allocation-header">
                <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1>Guide Allocation Manager</h1>
            </header>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="allocation-container">
                {/* Manual Assignment */}
                <section>
                    <h2><Users size={24} /> Assign Student to Guide</h2>
                    <div className="assignment-form">
                        <div className="form-group">
                            <label>Select Unassigned Student</label>
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">-- Choose Student --</option>
                                {unassignedStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} ({student.department || 'N/A'})
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
                                <option value="">-- Choose Guide --</option>
                                {guides.map(guide => (
                                    <option key={guide.id} value={guide.id}>
                                        {guide.name} ({guide.student_count} assigned)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="assign-btn"
                            onClick={() => handleAssign(selectedStudent, selectedGuide)}
                            disabled={loading || !selectedStudent || !selectedGuide}
                        >
                            <UserCheck size={20} />
                            {loading ? 'Assigning...' : 'Assign Guide'}
                        </button>
                    </div>
                </section>

                {/* Auto Allocation */}
                <section className="auto-allocation-section">
                    <h2><Shuffle size={24} /> One-Click Auto Allocation</h2>
                    <div className="stats">
                        <div className="stat-card">
                            <span className="stat-number">{unassignedStudents.length}</span>
                            <span className="stat-label">Pending Students</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-number">{guides.length}</span>
                            <span className="stat-label">Total Guides</span>
                        </div>
                    </div>
                    <button
                        className="auto-allocate-btn"
                        onClick={handleAutoAllocate}
                        disabled={loading || unassignedStudents.length === 0}
                    >
                        <Shuffle size={18} />
                        {loading ? 'Working...' : 'Auto-Allocate Pending Students'}
                    </button>
                </section>

                {/* Status Table */}
                <section>
                    <h2><RefreshCw size={24} /> Allocation Status</h2>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Department</th>
                                    <th>Allocated Guide</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.department || '-'}</td>
                                        <td style={{ fontWeight: student.guide ? '600' : '400', color: student.guide ? '#0f172a' : '#94a3b8' }}>
                                            {student.guide ? student.guide.name : 'Not Allocated'}
                                        </td>
                                        <td>
                                            {/* Reassign UI could go here, for now simpler is better */}
                                            {student.guide ? (
                                                <span className="status-badge assigned">Assigned</span>
                                            ) : (
                                                <span className="status-badge unassigned">Pending</span>
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
