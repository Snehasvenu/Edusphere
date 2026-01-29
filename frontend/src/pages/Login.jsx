import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        // Force clear state after a delay to overwrite browser autofill
        const timer = setTimeout(() => {
            setCredentials({ username: '', password: '' });
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Map renamed fields back to what backend expects
            const payload = {
                username: credentials.username,
                password: credentials.password
            };
            const response = await axios.post('http://localhost:8000/api/login/', payload);
            const { token, role, username } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('username', username);

            if (role && role.toUpperCase() === 'STUDENT') {
                navigate('/student-dashboard');
            } else if (role && role.toUpperCase() === 'GUIDE') {
                navigate('/guide-dashboard');
            } else if (role && role.toUpperCase() === 'COORDINATOR') {
                navigate('/coordinator-dashboard');
            } else if (role && role.toUpperCase() === 'ADMIN') {
                navigate('/admin-dashboard');
            } else {
                alert(`Logged in as ${role}`);
            }
        } catch (err) {
            if (!err.response) {
                setError('Server is not responding. Please check if the backend is running.');
            } else {
                setError('Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>EduSphere</h1>
                <p>Welcome back! Please login to your account.</p>
                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* Dummy fields to fool browser autofill */}
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />
                    <div className="input-group">
                        <label htmlFor="username">Email ID</label>
                        <input
                            type="email"
                            id="login_id_field"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            autoComplete="off"
                            readOnly
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="login_pass_field"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            readOnly
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    <div className="login-footer">
                        <Link to="#forgot-password">Forgot Password?</Link>
                        <span>New User? <Link to="/register">Register</Link></span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
