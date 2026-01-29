import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        register_number: '',
        department: 'MCA'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        // Force clear state after a delay to overwrite browser autofill
        const timer = setTimeout(() => {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'STUDENT',
                register_number: '',
                department: 'MCA'
            });
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Use email as username for the backend
            const payload = {
                ...formData,
                username: formData.email,
                role: formData.role
            };
            await axios.post('http://localhost:8000/api/register/', payload);
            setSuccess(true);
            setTimeout(() => {
                if (formData.role === 'STUDENT') {
                    navigate('/student-dashboard');
                } else if (formData.role === 'GUIDE') {
                    navigate('/guide-dashboard');
                } else {
                    navigate('/login');
                }
            }, 2500);
        } catch (err) {
            console.error('Registration error:', err);
            if (!err.response) {
                setError('Server is unreachable. Please make sure the backend is running.');
            } else {
                setError(err.response?.data?.error || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Register</h1>
                {success ? (
                    <div className="success-container">
                        <div className="success-icon">✓</div>
                        <h2>Successfully Registered</h2>
                        <p>Redirecting you to the login page...</p>
                        <Link to="/login" className="login-now-btn">Login Now</Link>
                    </div>
                ) : (
                    <>
                        <p>Create your account to get started.</p>
                        <form onSubmit={handleSubmit} autoComplete="off">
                            {/* Dummy fields to fool browser autofill */}
                            <input type="text" style={{ display: 'none' }} />
                            <input type="password" style={{ display: 'none' }} />
                            <div className="input-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="reg_name_field"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoComplete="off"
                                    readOnly
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="email">Email ID</label>
                                <input
                                    type="email"
                                    id="reg_email_field"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="off"
                                    readOnly
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="role">Select Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="role-select"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="GUIDE">Project Guide</option>
                                    <option value="COORDINATOR">Project Coordinator</option>
                                </select>
                            </div>
                            {formData.role === 'STUDENT' && (
                                <div className="input-group">
                                    <label htmlFor="register_number">Register Number</label>
                                    <input
                                        type="text"
                                        id="reg_num_field"
                                        name="register_number"
                                        value={formData.register_number}
                                        onChange={handleChange}
                                        required
                                        autoComplete="off"
                                        readOnly
                                        onFocus={(e) => e.target.removeAttribute('readonly')}
                                    />
                                </div>
                            )}
                            {formData.role === 'STUDENT' && (
                                <div className="input-group">
                                    <label htmlFor="reg_dept_field">Department</label>
                                    <select
                                        id="reg_dept_field"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        required
                                        className="role-select"
                                    >
                                        <option value="MCA">MCA</option>
                                        <option value="IMCA">IMCA</option>
                                    </select>
                                </div>
                            )}
                            {/* Batch removed */}
                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="reg_pass_field"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    readOnly
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button type="submit" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Register'}
                            </button>
                            <div className="login-footer" style={{ justifyContent: 'center' }}>
                                <span>Already have an account? <Link to="/login">Login</Link></span>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Register;
