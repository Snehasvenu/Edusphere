import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    FileEdit,
    BarChart3,
    ClipboardCheck,
    Bell,
    LogOut,
    UserCheck,
    CircleUser,
    LayoutDashboard
} from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Student';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const modules = [
        {
            id: 1,
            title: 'Allocated Guide',
            icon: <UserCheck size={36} strokeWidth={2} />,
            color: '#6366f1',
            path: '/student-profile'
        },
        {
            id: 2,
            title: 'Project Topic Submission',
            icon: <FileEdit size={36} strokeWidth={2} />,
            color: '#8b5cf6',
            path: '/topic-submission'
        },
        {
            id: 3,
            title: 'Project Status',
            icon: <BarChart3 size={36} strokeWidth={2} />,
            color: '#ec4899',
            path: '/project-status'
        },
        {
            id: 4,
            title: 'Review Marks & Evaluation',
            icon: <ClipboardCheck size={36} strokeWidth={2} />,
            color: '#06b6d4',
            path: '/review-marks'
        }
    ];

    return (
        <div className="dashboard-container">
            <div className="background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <header className="student-dashboard-header">
                <div className="header-left">
                    <div className="logo-icon">
                        <div className="logo-inner"></div>
                    </div>
                    <h1>EduSphere</h1>
                </div>
                <div className="header-right">
                    <div className="user-profile">
                        <CircleUser size={20} />
                        <span>{username}</span>
                    </div>
                    <button className="icon-btn" title="Notifications">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="welcome-section">
                    <h2>Welcome back!</h2>
                    <p>Manage your academic projects and tracking with ease.</p>
                </div>

                <div className="modules-grid">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className="module-card"
                            onClick={() => {
                                if (module.action) module.action();
                                else if (module.path) navigate(module.path);
                            }}
                        >
                            <div className="icon-wrapper" style={{ color: module.color }}>
                                {module.icon}
                                <div className="icon-blur" style={{ backgroundColor: module.color }}></div>
                            </div>
                            <div className="card-info">
                                <h3>{module.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
