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
        r2_project_progress_marks: 'Loading...',
        r2_presentation_marks: 'Loading...',
        r2_ui_creation_marks: 'Loading...',
        r3_project_progress_marks: 'Loading...',
        r3_ui_creation_marks: 'Loading...',
        r3_testing_methods_marks: 'Loading...',
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

    const renderDetailedReviewCard = (title, phaseNum, totalMark, mainScore, subScores) => {
        const isEvaluated = mainScore !== 'Not Evaluated' && mainScore !== 'Loading...';

        return (
            <div className={`mark-card ${!isEvaluated ? 'pending' : ''}`} style={{ gridColumn: '1 / -1' }}>
                <div className="mark-card-header">
                    <div className="mark-icon-box">
                        <Award size={24} />
                    </div>
                    <div className="mark-title-info">
                        <h3>{title} Detailed Marks</h3>
                        <p>Phase 0{phaseNum} Evaluation</p>
                    </div>
                    {marks.updated_at && phaseNum === 1 && (
                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                            Last Updated: {new Date(marks.updated_at).toLocaleString()}
                        </div>
                    )}
                </div>
                
                <div className="mark-score-display" style={{ display: 'grid', gridTemplateColumns: `repeat(${subScores.length + 1}, 1fr)`, gap: '16px', marginTop: '16px'}}>
                    {subScores.map((sub, idx) => (
                        <div key={idx} className="sub-score">
                            <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>{sub.label}</span>
                            <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '20px', fontWeight: '600', color: '#1e293b'}}>
                                {isEvaluated ? `${sub.value} / ${sub.max}` : '—'}
                            </span>
                        </div>
                    ))}
                    <div className="sub-score" style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '16px' }}>
                        <span className="score-label" style={{display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px'}}>Total Score</span>
                        <span className={`score-value ${!isEvaluated ? 'text-muted' : ''}`} style={{fontSize: '24px', fontWeight: '700', color: '#3b82f6'}}>
                            {isEvaluated ? `${mainScore} / ${totalMark}` : '—'}
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

    const calculateGrandTotal = () => {
        const m1 = parseFloat(marks.review1_marks) || 0;
        const m2 = parseFloat(marks.review2_marks) || 0;
        const m3 = parseFloat(marks.review3_marks) || 0;
        return (m1 + m2 + m3).toFixed(2);
    };

    const isAnyEvaluated = marks.review1_marks !== 'Not Evaluated' || marks.review2_marks !== 'Not Evaluated' || marks.review3_marks !== 'Not Evaluated';

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
                    {renderDetailedReviewCard('Review 1', 1, 20, marks.review1_marks, [
                        { label: 'Project Progress', value: marks.project_progress_marks, max: 10 },
                        { label: 'Scrum & Git', value: marks.scrum_git_marks, max: 5 },
                        { label: 'Presentation', value: marks.presentation_marks, max: 5 }
                    ])}
                    
                    {renderDetailedReviewCard('Review 2', 2, 20, marks.review2_marks, [
                        { label: 'Project Progress', value: marks.r2_project_progress_marks, max: 10 },
                        { label: 'Presentation', value: marks.r2_presentation_marks, max: 5 },
                        { label: 'UI Creation', value: marks.r2_ui_creation_marks, max: 5 }
                    ])}

                    {renderDetailedReviewCard('Review 3', 3, 20, marks.review3_marks, [
                        { label: 'Project Progress', value: marks.r3_project_progress_marks, max: 10 },
                        { label: 'UI Creation', value: marks.r3_ui_creation_marks, max: 5 },
                        { label: 'Testing Methods', value: marks.r3_testing_methods_marks, max: 5 }
                    ])}

                    {isAnyEvaluated && (
                        <div className="grand-total-card" style={{
                            gridColumn: '1 / -1',
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            color: 'white',
                            padding: '28px',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            marginTop: '20px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                                <div>
                                    <h3 style={{margin: 0, fontSize: '20px', fontWeight: '700'}}>Performance Summary</h3>
                                    <p style={{margin: '4px 0 0 0', opacity: 0.7, fontSize: '14px'}}>Consolidated scores from all evaluation phases</p>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <span style={{display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', opacity: 0.6}}>Overall Total</span>
                                    <span style={{fontSize: '42px', fontWeight: '900', color: '#60a5fa', lineHeight: '1'}}>{calculateGrandTotal()} <span style={{fontSize: '20px', opacity: 0.5}}>/ 60</span></span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Review 1 Total</span>
                                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{marks.review1_marks || 0} <span style={{fontSize: '14px', opacity: 0.4}}>/ 20</span></span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Review 2 Total</span>
                                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{marks.review2_marks || 0} <span style={{fontSize: '14px', opacity: 0.4}}>/ 20</span></span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Review 3 Total</span>
                                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{marks.review3_marks || 0} <span style={{fontSize: '14px', opacity: 0.4}}>/ 20</span></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReviewMarks;
