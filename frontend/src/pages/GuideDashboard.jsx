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
                                        <div className="evaluation-group">
                                            {/* Review 1 Phase */}
                                            <div className="review-phase-card">
                                                <div className="phase-header">
                                                    <h4 className="phase-title">Review 1 Evaluation</h4>
                                                    <div className="total-score-badge">
                                                        <span>Total:</span>
                                                        <span id={`m1_total-${student.email}`} style={{color: 'var(--accent)'}}>{student.evaluation?.review1_marks || 0}</span>
                                                        <span style={{opacity: 0.5}}>/ 20</span>
                                                    </div>
                                                </div>
                                                <div className="inputs-container">
                                                    <div className="mark-field">
                                                        <label>Project Progress (10)</label>
                                                        <input type="number" min="0" max="10" placeholder="0-10" id={`m1_prog-${student.email}`} 
                                                            defaultValue={student.evaluation?.project_progress_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(e.target.value || 0);
                                                                const s = parseFloat(document.getElementById(`m1_scrum-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m1_pres-${student.email}`)?.value || 0);
                                                                document.getElementById(`m1_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>Scrum/Git Activity (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m1_scrum-${student.email}`} 
                                                            defaultValue={student.evaluation?.scrum_git_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m1_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(e.target.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m1_pres-${student.email}`)?.value || 0);
                                                                document.getElementById(`m1_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>Presentation Prep (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m1_pres-${student.email}`} 
                                                            defaultValue={student.evaluation?.presentation_marks || 0}
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
                                            
                                            {/* Review 2 Phase */}
                                            <div className="review-phase-card">
                                                <div className="phase-header">
                                                    <h4 className="phase-title">Review 2 Evaluation</h4>
                                                    <div className="total-score-badge">
                                                        <span>Total:</span>
                                                        <span id={`m2_total-${student.email}`} style={{color: 'var(--accent)'}}>{student.evaluation?.review2_marks || 0}</span>
                                                        <span style={{opacity: 0.5}}>/ 20</span>
                                                    </div>
                                                </div>
                                                <div className="inputs-container">
                                                    <div className="mark-field">
                                                        <label>Project Progress (10)</label>
                                                        <input type="number" min="0" max="10" placeholder="0-10" id={`m2_prog-${student.email}`} 
                                                            defaultValue={student.evaluation?.r2_project_progress_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(e.target.value || 0);
                                                                const s = parseFloat(document.getElementById(`m2_pres-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m2_ui-${student.email}`)?.value || 0);
                                                                document.getElementById(`m2_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>Presentation (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m2_pres-${student.email}`} 
                                                            defaultValue={student.evaluation?.r2_presentation_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m2_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(e.target.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m2_ui-${student.email}`)?.value || 0);
                                                                document.getElementById(`m2_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>UI Creation (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m2_ui-${student.email}`} 
                                                            defaultValue={student.evaluation?.r2_ui_creation_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m2_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(document.getElementById(`m2_pres-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(e.target.value || 0);
                                                                document.getElementById(`m2_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Review 3 Phase */}
                                            <div className="review-phase-card">
                                                <div className="phase-header">
                                                    <h4 className="phase-title">Review 3 Evaluation</h4>
                                                    <div className="total-score-badge">
                                                        <span>Total:</span>
                                                        <span id={`m3_total-${student.email}`} style={{color: 'var(--accent)'}}>{student.evaluation?.review3_marks || 0}</span>
                                                        <span style={{opacity: 0.5}}>/ 20</span>
                                                    </div>
                                                </div>
                                                <div className="inputs-container">
                                                    <div className="mark-field">
                                                        <label>Project Progress (10)</label>
                                                        <input type="number" min="0" max="10" placeholder="0-10" id={`m3_prog-${student.email}`} 
                                                            defaultValue={student.evaluation?.r3_project_progress_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(e.target.value || 0);
                                                                const s = parseFloat(document.getElementById(`m3_ui-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m3_test-${student.email}`)?.value || 0);
                                                                document.getElementById(`m3_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>UI Creation (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m3_ui-${student.email}`} 
                                                            defaultValue={student.evaluation?.r3_ui_creation_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m3_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(e.target.value || 0);
                                                                const pr = parseFloat(document.getElementById(`m3_test-${student.email}`)?.value || 0);
                                                                document.getElementById(`m3_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mark-field">
                                                        <label>Testing Methods (5)</label>
                                                        <input type="number" min="0" max="5" placeholder="0-5" id={`m3_test-${student.email}`} 
                                                            defaultValue={student.evaluation?.r3_testing_methods_marks || 0}
                                                            onChange={(e) => {
                                                                const p = parseFloat(document.getElementById(`m3_prog-${student.email}`)?.value || 0);
                                                                const s = parseFloat(document.getElementById(`m3_ui-${student.email}`)?.value || 0);
                                                                const pr = parseFloat(e.target.value || 0);
                                                                document.getElementById(`m3_total-${student.email}`).innerText = (p+s+pr);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="eval-footer">
                                            <button className="save-btn" onClick={() => {
                                                const prog = document.getElementById(`m1_prog-${student.email}`).value;
                                                const scrum = document.getElementById(`m1_scrum-${student.email}`).value;
                                                const pres = document.getElementById(`m1_pres-${student.email}`).value;
                                                
                                                const prog2 = document.getElementById(`m2_prog-${student.email}`).value;
                                                const pres2 = document.getElementById(`m2_pres-${student.email}`).value;
                                                const ui2 = document.getElementById(`m2_ui-${student.email}`).value;

                                                const prog3 = document.getElementById(`m3_prog-${student.email}`).value;
                                                const ui3 = document.getElementById(`m3_ui-${student.email}`).value;
                                                const test3 = document.getElementById(`m3_test-${student.email}`).value;
                                                
                                                const pVal = parseFloat(prog);
                                                const sVal = parseFloat(scrum);
                                                const prVal = parseFloat(pres);

                                                let error = "";
                                                if (prog && (pVal < 0 || pVal > 10)) error += "Project Progress must be between 0 and 10.\n";
                                                if (scrum && (sVal < 0 || sVal > 5)) error += "Scrum Book & Git Activity must be between 0 and 5.\n";
                                                if (pres && (prVal < 0 || prVal > 5)) error += "Presentation & Communication must be between 0 and 5.\n";
                                                
                                                if (prog2 && (parseFloat(prog2) < 0 || parseFloat(prog2) > 10)) error += "Review 2: Project Progress must be between 0 and 10.\n";
                                                if (pres2 && (parseFloat(pres2) < 0 || parseFloat(pres2) > 5)) error += "Review 2: Presentation must be between 0 and 5.\n";
                                                if (ui2 && (parseFloat(ui2) < 0 || parseFloat(ui2) > 5)) error += "Review 2: UI Creation must be between 0 and 5.\n";

                                                if (prog3 && (parseFloat(prog3) < 0 || parseFloat(prog3) > 10)) error += "Review 3: Project Progress must be between 0 and 10.\n";
                                                if (ui3 && (parseFloat(ui3) < 0 || parseFloat(ui3) > 5)) error += "Review 3: UI Creation must be between 0 and 5.\n";
                                                if (test3 && (parseFloat(test3) < 0 || parseFloat(test3) > 5)) error += "Review 3: Testing Methods must be between 0 and 5.\n";

                                                if (error) {
                                                    alert(error);
                                                    return;
                                                }

                                                handleMarksUpdate(student.email, {
                                                    project_progress_marks: prog,
                                                    scrum_git_marks: scrum,
                                                    presentation_marks: pres,
                                                    r2_project_progress_marks: prog2,
                                                    r2_presentation_marks: pres2,
                                                    r2_ui_creation_marks: ui2,
                                                    r3_project_progress_marks: prog3,
                                                    r3_ui_creation_marks: ui3,
                                                    r3_testing_methods_marks: test3,
                                                });
                                            }}>Save Evaluation</button>
                                        </div>
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
