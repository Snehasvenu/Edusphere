import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Upload,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    Bell,
    FileUp,
    Check
} from 'lucide-react';
import './TopicSubmission.css';

const TopicSubmission = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState({
        abstract1: null,
        abstract2: null,
        abstract3: null
    });
    const [existingFiles, setExistingFiles] = useState({
        abstract1: null,
        abstract2: null,
        abstract3: null
    });
    const [status, setStatus] = useState({
        loading: true,
        uploading: false,
        message: '',
        error: ''
    });

    const fileInputRefs = {
        abstract1: useRef(null),
        abstract2: useRef(null),
        abstract3: useRef(null)
    };

    const userEmail = localStorage.getItem('username');

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/submit-topics/?email=${userEmail}`);
                setExistingFiles(response.data);
            } catch (err) {
                console.error('Error fetching submissions:', err);
            } finally {
                setStatus(prev => ({ ...prev, loading: false }));
            }
        };
        fetchSubmissions();
    }, [userEmail]);

    const handleFileChange = (e, abstractKey) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFiles(prev => ({ ...prev, [abstractKey]: file }));
            setStatus(prev => ({ ...prev, error: '', message: '' }));
        } else if (file) {
            setStatus(prev => ({ ...prev, error: 'Only PDF files are allowed.' }));
        }
    };

    const handleUpload = async (abstractKey) => {
        if (!files[abstractKey]) return;

        setStatus(prev => ({ ...prev, uploading: true, error: '', message: '' }));
        const formData = new FormData();
        formData.append('email', userEmail);
        formData.append(abstractKey, files[abstractKey]);

        try {
            await axios.post('http://localhost:8000/api/submit-topics/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus(prev => ({ ...prev, message: `${abstractKey.replace('abstract', 'Abstract ')} uploaded successfully!` }));
            setExistingFiles(prev => ({ ...prev, [abstractKey]: files[abstractKey].name }));
            setFiles(prev => ({ ...prev, [abstractKey]: null }));
        } catch (err) {
            setStatus(prev => ({ ...prev, error: 'Failed to upload file. Please try again.' }));
        } finally {
            setStatus(prev => ({ ...prev, uploading: false }));
        }
    };

    const renderUploadSlot = (abstractKey, label) => {
        const isSelected = !!files[abstractKey];
        const isUploaded = !!existingFiles[abstractKey];
        const currentFile = files[abstractKey];
        const fileName = isSelected ? currentFile.name : (isUploaded ? existingFiles[abstractKey].split('/').pop() : 'No file chosen');

        return (
            <div className="upload-slot">
                <div className="slot-header">
                    <h3>{label}</h3>
                    {isUploaded && <span className="status-badge uploaded"><Check size={14} /> Uploaded</span>}
                </div>
                <div className={`drop-zone ${isSelected ? 'active' : ''}`}>
                    <FileText size={40} className="file-icon" />
                    <div className="file-info">
                        <p className="file-name">{fileName}</p>
                        <p className="file-hint">Only PDF files (Max 5MB)</p>
                    </div>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, abstractKey)}
                        ref={fileInputRefs[abstractKey]}
                        style={{ display: 'none' }}
                    />
                    <div className="action-btns">
                        <button
                            className="secondary-btn"
                            onClick={() => fileInputRefs[abstractKey].current.click()}
                        >
                            {isUploaded ? 'Replace File' : 'Choose File'}
                        </button>
                        {isSelected && (
                            <button
                                className="primary-btn"
                                onClick={() => handleUpload(abstractKey)}
                                disabled={status.uploading}
                            >
                                <Upload size={18} /> {status.uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (status.loading) return <div className="loading-state">Loading...</div>;

    return (
        <div className="topic-submission-container">
            <header className="dashboard-header slim-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/student-dashboard')}>
                        <ChevronLeft size={20} />
                    </button>
                    <span className="page-title">Project Topic Submission</span>
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

            <main className="submission-content">
                <div className="submission-card">
                    <div className="card-intro">
                        <h2>Upload Your Abstracts</h2>
                    </div>

                    {status.error && (
                        <div className="alert-message error">
                            <XCircle size={20} />
                            {status.error}
                        </div>
                    )}
                    {status.message && (
                        <div className="alert-message success">
                            <CheckCircle2 size={20} />
                            {status.message}
                        </div>
                    )}

                    <div className="project-title-section">
                        <label htmlFor="project-title">Project Title</label>
                        <div className="title-input-wrapper">
                            <input
                                type="text"
                                id="project-title"
                                placeholder="Enter your project title here..."
                                value={existingFiles.project_title || ''}
                                onChange={(e) => setExistingFiles(prev => ({ ...prev, project_title: e.target.value }))}
                            />
                            <button
                                className="save-title-btn"
                                onClick={async () => {
                                    setStatus(prev => ({ ...prev, uploading: true }));
                                    try {
                                        await axios.post('http://localhost:8000/api/submit-topics/', {
                                            email: userEmail,
                                            project_title: existingFiles.project_title
                                        });
                                        setStatus(prev => ({ ...prev, message: 'Project title saved!' }));
                                    } catch (err) {
                                        setStatus(prev => ({ ...prev, error: 'Failed to save title.' }));
                                    } finally {
                                        setStatus(prev => ({ ...prev, uploading: false }));
                                    }
                                }}
                            >
                                Save Title
                            </button>
                        </div>
                    </div>

                    <div className="status-overview">
                        <div className="status-item">
                            <span className="label">Current Status:</span>
                            <span className={`status-val ${existingFiles.status?.toLowerCase() || 'pending'}`}>
                                {existingFiles.status || 'Pending'}
                            </span>
                        </div>
                        {existingFiles.remarks && (
                            <div className="remarks-item">
                                <span className="label">Guide Remarks:</span>
                                <p className="remarks-text">{existingFiles.remarks}</p>
                            </div>
                        )}
                    </div>

                    <div className="upload-grid">
                        {renderUploadSlot('abstract1', 'Abstract 1')}
                        {renderUploadSlot('abstract2', 'Abstract 2')}
                        {renderUploadSlot('abstract3', 'Abstract 3')}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TopicSubmission;
