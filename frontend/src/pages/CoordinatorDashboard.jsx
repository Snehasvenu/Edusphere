import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    GitMerge,
    FileText,
    Copy,
    Star,
    Bell,
    PieChart,
    LogOut
} from 'lucide-react';
import './CoordinatorDashboard.css';

const CoordinatorDashboard = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Coordinator';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const modules = [
        { id: 1, title: 'Students', icon: <Users size={48} />, color: '#4f46e5', action: () => navigate('/students-list') },
        { id: 2, title: 'Guides', icon: <UserCheck size={48} />, color: '#0891b2', action: () => navigate('/guides-list') },
        { id: 3, title: 'Allocation', icon: <GitMerge size={48} />, color: '#059669', action: () => navigate('/guide-allocation') },
        { id: 4, title: 'Abstracts', icon: <FileText size={48} />, color: '#d97706', action: () => navigate('/approved-abstracts') },
        { id: 5, title: 'Duplicates', icon: <Copy size={48} />, color: '#dc2626' }
    ];

    return (
        <div className="coordinator-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="logo-icon">
                        <div className="logo-inner"></div>
                    </div>
                    <h1>EduSphere Coordinator</h1>
                </div>
                <div className="header-right">
                    <span className="welcome-text">Welcome, {username}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="modules-grid">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className="module-card"
                            onClick={() => module.action ? module.action() : null}
                        >
                            <div className="icon-container" style={{ color: module.color }}>
                                {module.icon}
                            </div>
                            <span className="module-label">{module.title}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDashboard;
