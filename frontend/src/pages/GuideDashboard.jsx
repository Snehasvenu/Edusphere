import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    LogOut,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    RotateCcw,
    Download,
    Eye,
    AlertTriangle,
    BarChart,
    UserCircle,
    ClipboardList
} from 'lucide-react';
import './GuideDashboard.css';

const GuideDashboard = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [guideInfo, setGuideInfo] = useState({ name: '', email: '' });
    const [activeTab, setActiveTab] = useState('students');
    const [selectedAbstracts, setSelectedAbstracts] = useState({});

    const userEmail = localStorage.getItem('username');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch students assigned to this guide
                const response = await axios.get(`http://localhost:8000/api/alotted-students/?email=${userEmail}`);
                setStudents(response.data);

                // Fetch guide name for navbar
                const profileResp = await axios.get(`http://localhost:8000/api/profile/?email=${userEmail}`);
                setGuideInfo({ name: profileResp.data.name, email: userEmail });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        if (userEmail) fetchDashboardData();
    }, [userEmail]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleStatusUpdate = async (studentEmail, status, remarks) => {
        const approved_abstract = selectedAbstracts[studentEmail];

        if (status === 'APPROVED' && !approved_abstract) {
            alert('Please select an abstract to approve first');
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/update-topic-status/', {
                email: studentEmail,
                status,
                remarks,
                approved_abstract: approved_abstract
            });
            // Refresh data
            const response = await axios.get(`http://localhost:8000/api/alotted-students/?email=${userEmail}`);
            setStudents(response.data);
            alert('Status updated successfully');
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const handleMarksUpdate = async (studentEmail, marks) => {
        try {
            await axios.post('http://localhost:8000/api/update-evaluation/', {
                email: studentEmail,
                ...marks
            });
            alert('Marks saved successfully');
        } catch (err) {
            console.error('Error saving marks:', err);
            alert('Failed to save marks');
        }
    };

    return (
        <div className="new-guide-dashboard">
            <nav className="dashboard-nav">
                <div className="nav-left">
                    <span className="app-logo">EDUSPHERE</span>
                    <div className="nav-links">
                        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>Students</button>
                        <button className={activeTab === 'topics' ? 'active' : ''} onClick={() => setActiveTab('topics')}>Topics</button>
                        <button className={activeTab === 'evaluation' ? 'active' : ''} onClick={() => setActiveTab('evaluation')}>Evaluation</button>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="guide-profile">
                        <div className="profile-info">
                            <span className="profile-name">{guideInfo.name}</span>
                            <span className="role-badge">Project Guide</span>
                        </div>
                        <UserCircle size={24} color="#1e293b" />
                    </div>
                    <div className="nav-icons">
                        <button className="nav-icon-btn">
                            <Bell size={20} />
                        </button>
                        <button className="logout-btn-compact" onClick={handleLogout}>
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="dashboard-content">
                {activeTab === 'students' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2><Users /> Assigned Students</h2>
                        </div>
                        <div className="dashboard-card table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Register Number</th>
                                        <th>Department</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, idx) => (
                                        <tr key={idx}>
                                            <td>{student.name}</td>
                                            <td><span className="badge">{student.register_number}</span></td>
                                            <td>{student.department}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'topics' && (
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h2><FileText /> Project Topic & Abstract Review</h2>
                        </div>
                        <div className="project-grid">
                            {students.map((student, idx) => (
                                <div key={idx} className="project-card-v2">
                                    <div className="card-header-row">
                                        <div className="student-ident">
                                            <h3>{student.name}</h3>
                                            <div className="sub-info">
                                                <div className="info-item">
                                                    <span className="item-label">Department:</span>
                                                    <span className="info-badge dept">{student.department}</span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="item-label">Reg No:</span>
                                                    <span className="info-badge reg">{student.register_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="abstract-previews">
                                            {[1, 2, 3].map(num => (
                                                student.project?.[`abstract${num}`] && (
                                                    <div key={num} className={`abstract-item ${selectedAbstracts[student.email] === num ? 'selected' : ''} ${student.project.approved_abstract === num ? 'approved' : ''}`}>
                                                        <div className="abstract-info-row">
                                                            <a href={`http://localhost:8000${student.project[`abstract${num}`]}`} target="_blank" rel="noopener noreferrer" className="abstract-link">
                                                                <FileText size={16} /> Abstract {num}
                                                            </a>
                                                            {student.project.approved_abstract === num && <span className="approved-pill"><CheckCircle size={12} /> Approved</span>}
                                                        </div>
                                                        <div className="abstract-actions">
                                                            <button className="preview-btn" onClick={() => window.open(`http://localhost:8000${student.project[`abstract${num}`]}`, '_blank')}>
                                                                <Eye size={14} /> Preview
                                                            </button>
                                                            <button
                                                                className={`select-btn ${selectedAbstracts[student.email] === num ? 'active' : ''}`}
                                                                onClick={() => setSelectedAbstracts(prev => ({ ...prev, [student.email]: num }))}
                                                            >
                                                                {selectedAbstracts[student.email] === num ? 'Selected' : 'Select'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                            {(!student.project?.abstract1 && !student.project?.abstract2 && !student.project?.abstract3) && (
                                                <p className="no-upload">No abstracts uploaded</p>
                                            )}
                                        </div>

                                        <div className="approval-section-v2">
                                            <h4>Topic Approval & Remarks</h4>
                                            <textarea
                                                placeholder="Enter your remarks here..."
                                                defaultValue={student.project?.remarks}
                                                id={`remarks-${student.email}`}
                                                className="remarks-area"
                                            />
                                            <div className="action-row-v2">
                                                <button className="btn-v2 approve" onClick={() => handleStatusUpdate(student.email, 'APPROVED', document.getElementById(`remarks-${student.email}`).value)}>
                                                    Approve
                                                </button>
                                                <button className="btn-v2 reject" onClick={() => handleStatusUpdate(student.email, 'REJECTED', document.getElementById(`remarks-${student.email}`).value)}>
                                                    Reject
                                                </button>
                                                <button className="btn-v2 revise" onClick={() => handleStatusUpdate(student.email, 'REVISION', document.getElementById(`remarks-${student.email}`).value)}>
                                                    Revision
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section >
                )}

                {
                    activeTab === 'evaluation' && (
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2><ClipboardList /> Review Marks & Evaluation</h2>
                            </div>
                            <div className="evaluation-list">
                                {students.map((student, idx) => (
                                    <div key={idx} className="eval-card">
                                        <div className="eval-header">
                                            <h3>{student.name}</h3>
                                            <div className="eval-sub-info">
                                                <span className="eval-badge">Dept: {student.department}</span>
                                                <span className="eval-badge">Reg No: {student.register_number}</span>
                                            </div>
                                        </div>
                                        <div className="marks-grid detailed">
                                            <div className="review-section">
                                                <div className="review-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                                                    <h4 style={{margin: 0, fontSize: '14px', color: '#1e293b'}}>Review 1 Breakdown</h4>
                                                    <span className="total-badge" style={{fontSize: '13px', fontWeight: '600', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '12px'}}>Total: <span id={`m1_total-${student.email}`}>0</span> / 20</span>
                                                </div>
                                                <div className="mark-input-group" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px'}}>
                                                    <div className="mark-input">
                                                        <label>Progress (10)</label>
                                                        <input type="number" min="0" max="10" placeholder="0-10" id={`m1_prog-${student.email}`} 
                                                            onChange={(e) => {
                                                                const p = parseFloat(e.target.value || 0);
                                                                const s = parseFloat(document.getElementById(`m1_scrum-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m1_pres-${student.email}`)?.value || 0);
                                                                document.getElementById(`m1_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-input">
                                                        <label>Scrum/Git (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m1_scrum-${student.email}`} 
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m1_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(e.target.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m1_pres-${student.email}`)?.value || 0);
                                                                document.getElementById(`m1_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-input">
                                                        <label>Presentation (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m1_pres-${student.email}`} 
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m1_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(document.getElementById(`m1_scrum-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(e.target.value || 0);
                                                                document.getElementById(`m1_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="review-section">
                                                <h4 style={{margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b'}}>Later Reviews</h4>
                                                <div className="mark-input-group" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                                                    <div className="mark-input">
                                                        <label>Review 2</label>
                                                        <input type="number" placeholder="Marks" id={`m2-${student.email}`} />
                                                    </div>
                                                    <div className="mark-input">
                                                        <label>Review 3</label>
                                                        <input type="number" placeholder="Marks" id={`m3-${student.email}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="save-btn" style={{marginTop: '16px'}} onClick={() => {
                                            const prog = document.getElementById(`m1_prog-${student.email}`).value;
                                            const scrum = document.getElementById(`m1_scrum-${student.email}`).value;
                                            const pres = document.getElementById(`m1_pres-${student.email}`).value;
                                            
                                            const pVal = parseFloat(prog);
                                            const sVal = parseFloat(scrum);
                                            const prVal = parseFloat(pres);

                                            let error = "";
                                            if (prog && (pVal < 0 || pVal > 10)) error += "Project Progress must be between 0 and 10.\n";
                                            if (scrum && (sVal < 0 || sVal > 5)) error += "Scrum Book & Git Activity must be between 0 and 5.\n";
                                            if (pres && (prVal < 0 || prVal > 5)) error += "Presentation & Communication must be between 0 and 5.\n";
                                            
                                            if (error) {
                                                alert(error);
                                                return;
                                            }

                                            handleMarksUpdate(student.email, {
                                                project_progress_marks: prog,
                                                scrum_git_marks: scrum,
                                                presentation_marks: pres,
                                                review2_marks: document.getElementById(`m2-${student.email}`).value,
                                                review3_marks: document.getElementById(`m3-${student.email}`).value,
                                            });
                                        }}>Save Evaluation</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )
                }


            </main >
        </div >
    );
};

export default GuideDashboard;
