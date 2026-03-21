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
        review3_marks: 'Loading...',
        project_progress_marks: 'Loading...',
        scrum_git_marks: 'Loading...',
        presentation_marks: 'Loading...',
        updated_at: null
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

    const renderReview1Card = () => {
        const isEvaluated = marks.review1_marks !== 'Not Evaluated' && marks.review1_marks !== 'Loading...';

        return (
            <div className={`mark-card ${!isEvaluated ? 'pending' : ''}`} style={{ gridColumn: '1 / -1' }}>
                <div className="mark-card-header">
                    <div className="mark-icon-box">
                        <Award size={24} />
                    </div>
                    <div className="mark-title-info">
                        <h3>Review 1 Detailed Marks</h3>
                        <p>Phase 01 Evaluation</p>
                    </div>
                    {marks.updated_at && (
                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                            Last Updated: {new Date(marks.updated_at).toLocaleString()}
                        </div>
                    )}
                </div>
                
                <div className="mark-score-display" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px'}}>
                    <div className="sub-score">
                        <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>Project Progress</span>
                        <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '20px', fontWeight: '600', color: '#1e293b'}}>
                            {isEvaluated ? `${marks.project_progress_marks} / 10` : '—'}
                        </span>
                    </div>
                    <div className="sub-score">
                        <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>Scrum & Git</span>
                        <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '20px', fontWeight: '600', color: '#1e293b'}}>
                            {isEvaluated ? `${marks.scrum_git_marks} / 5` : '—'}
                        </span>
                    </div>
                    <div className="sub-score">
                        <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>Presentation</span>
                        <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '20px', fontWeight: '600', color: '#1e293b'}}>
                            {isEvaluated ? `${marks.presentation_marks} / 5` : '—'}
                        </span>
                    </div>
                    <div className="sub-score" style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
                        <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>Total Score</span>
                        <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '24px', fontWeight: '700', color: '#3b82f6'}}>
                            {isEvaluated ? `${marks.review1_marks} / 20` : '—'}
                        </span>
                    </div>
                </div>
                
                <div className="mark-status" style={{marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9'}}>
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
                    {renderReview1Card()}
                    {renderMarkCard('Review 2', marks.review2_marks, 2)}
                    {renderMarkCard('Review 3', marks.review3_marks, 3)}
                </div>
            </main>
        </div>
    );
};

export default ReviewMarks;
