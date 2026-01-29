import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Settings,
    Database,
    Activity,
    Shield,
    LogOut,
    Bell
} from 'lucide-react';
import './CoordinatorDashboard.css'; // Reusing layout styles for consistency

const AdminDashboard = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const modules = [
        { id: 1, title: 'Manage Users', icon: <Users size={48} />, color: '#4f46e5' },
        { id: 2, title: 'System Settings', icon: <Settings size={48} />, color: '#0891b2' },
        { id: 3, title: 'Django Backend', icon: <Database size={48} />, color: '#059669', action: () => window.open('http://localhost:8000/admin', '_blank') },
        { id: 4, title: 'System Logs', icon: <Activity size={48} />, color: '#d97706' },
        { id: 5, title: 'Security', icon: <Shield size={48} />, color: '#dc2626' },
        { id: 6, title: 'Logout', icon: <LogOut size={48} />, color: '#ef4444', action: handleLogout }
    ];

    return (
        <div className="coordinator-dashboard admin-dashboard">
            <header className="dashboard-header" style={{ background: '#0f172a' }}>
                <div className="header-left">
                    <div className="logo-icon" style={{ background: '#f8fafc' }}>
                        <div className="logo-inner" style={{ background: '#0f172a' }}></div>
                    </div>
                    <h1 style={{ color: 'white' }}>EduSphere System Admin</h1>
                </div>
                <div className="header-right">
                    <span className="welcome-text" style={{ color: 'white' }}>Welcome, {username}</span>
                    <button className="nav-icon-btn">
                        <Bell size={24} color="white" />
                    </button>
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

export default AdminDashboard;
