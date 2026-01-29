import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Bell,
    Award,
    CheckCircle2,
    Clock
} from 'lucide-react';
import './ReviewMarks.css';

const ReviewMarks = () => {
    const navigate = useNavigate();
    const [marks, setMarks] = useState({
        review1_marks: 'Loading...',
        review2_marks: 'Loading...',
        review3_marks: 'Loading...'
    });
    const [loading, setLoading] = useState(true);

    const userEmail = localStorage.getItem('username');

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/evaluation/?email=${userEmail}`);
                setMarks(response.data);
            } catch (err) {
                console.error('Error fetching evaluation marks:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, [userEmail]);

    const renderMarkCard = (title, score, num) => {
        const isEvaluated = score !== 'Not Evaluated' && score !== 'Loading...';

        return (
            <div className={`mark-card ${!isEvaluated ? 'pending' : ''}`}>
                <div className="mark-card-header">
                    <div className="mark-icon-box">
                        <Award size={24} />
                    </div>
                    <div className="mark-title-info">
                        <h3>{title}</h3>
                        <p>Phase 0{num} Evaluation</p>
                    </div>
                </div>
                <div className="mark-score-display">
                    <span className="score-label">Score obtained</span>
                    <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`}>
                        {score}
                    </span>
                </div>
                <div className="mark-status">
                    {isEvaluated ? (
                        <span className="status-tag verified">
                            <CheckCircle2 size={14} /> Verified
                        </span>
                    ) : (
                        <span className="status-tag waiting">
                            <Clock size={14} /> In Progress
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-state">Loading Marks...</div>;

    return (
        <div className="review-marks-container">
            <header className="dashboard-header slim-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/student-dashboard')}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="page-title">Review Marks & Evaluation</span>
                </div>
                <div className="header-right">
                    <button className="icon-btn">
                        <Bell size={24} />
                    </button>
                    <button className="logout-btn" onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="review-content">
                <div className="marks-grid">
                    {renderMarkCard('Review 1', marks.review1_marks, 1)}
                    {renderMarkCard('Review 2', marks.review2_marks, 2)}
                    {renderMarkCard('Review 3', marks.review3_marks, 3)}
                </div>
            </main>
        </div>
    );
};

export default ReviewMarks;
