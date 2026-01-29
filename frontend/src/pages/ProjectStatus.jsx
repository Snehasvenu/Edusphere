import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Bell,
    LogOut,
    CircleUser,
    PlusCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Send
} from 'lucide-react';
import './ProjectStatus.css';

const ProjectStatus = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newLog, setNewLog] = useState({ stage: '', description: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    const username = localStorage.getItem('username') || 'Student';
    const email = localStorage.getItem('username');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/progress/?email=${email}`);
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newLog.stage || !newLog.description) return;

        setSubmitting(true);
        try {
            await axios.post('http://localhost:8000/api/progress/', {
                email,
                stage: newLog.stage,
                description: newLog.description
            });
            setMessage({ text: 'Progress updated successfully!', type: 'success' });
            setNewLog({ stage: '', description: '' });
            fetchLogs();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: 'Failed to update progress.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) return (
        <div className="loading-state">
            <div className="loader"></div>
            <p>Loading Progress Log...</p>
        </div>
    );

    return (
        <div className="status-page-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/student-dashboard')} title="Back to Dashboard">
                        <ChevronLeft size={24} />
                    </button>
                    <h1>Project Status & Progress</h1>
                </div>
                <div className="header-right">
                    <div className="user-profile">
                        <CircleUser size={20} />
                        <span>{username}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="status-content">
                {/* Introduction section */}
                <div className="welcome-banner" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'white' }}>Progress Dashboard</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }}>
                        Track and record your project milestones step-by-step.
                    </p>
                </div>

                {/* Add New Progress Log */}
                <div className="section-card">
                    <h2><PlusCircle size={28} color="#6366f1" /> Record New Progress</h2>
                    <form onSubmit={handleSubmit} className="progress-form">
                        <div className="form-group">
                            <label>Project Stage</label>
                            <input
                                type="text"
                                placeholder="e.g., Requirement Analysis, Database Design..."
                                value={newLog.stage}
                                onChange={(e) => setNewLog({ ...newLog, stage: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description of Work Done</label>
                            <textarea
                                rows="4"
                                placeholder="Details of the tasks completed in this stage..."
                                value={newLog.description}
                                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? 'Recording...' : <><Send size={18} /> List Progress</>}
                        </button>
                        {message.text && (
                            <div className={`status-msg ${message.type}`} style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                borderRadius: '8px',
                                background: message.type === 'success' ? '#def7ec' : '#fde8e8',
                                color: message.type === 'success' ? '#03543f' : '#9b1c1c',
                                fontWeight: 700,
                                textAlign: 'center'
                            }}>
                                {message.text}
                            </div>
                        )}
                    </form>
                </div>

                {/* Progress Timeline */}
                <div className="section-card">
                    <h2><Clock size={28} color="#ec4899" /> Project Timeline</h2>
                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <p>No progress records found. Start by recording your first stage above!</p>
                        </div>
                    ) : (
                        <div className="timeline">
                            {logs.map((log) => (
                                <div key={log.id} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <h3>{log.stage}</h3>
                                            <span className="timeline-date">
                                                <Calendar size={14} style={{ marginRight: '4px' }} />
                                                {log.completed_at}
                                            </span>
                                        </div>
                                        <p className="timeline-description">{log.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProjectStatus;
