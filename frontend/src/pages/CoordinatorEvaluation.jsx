import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, Search, Download } from 'lucide-react';
import './CoordinatorEvaluation.css';

const CoordinatorEvaluation = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/students/');
                setStudents(response.data);
            } catch (err) {
                console.error('Error fetching students:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const calculateCE = (m1, m2, m3) => {
        const avg = (parseFloat(m1 || 0) + parseFloat(m2 || 0) + parseFloat(m3 || 0)) / 3;
        return avg.toFixed(2);
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.register_number && student.register_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="loading-state">Loading evaluations...</div>;

    return (
        <div className="coordinator-eval-container">
            <header className="eval-page-header">
                <div className="header-content">
                    <button className="back-btn" onClick={() => navigate('/coordinator-dashboard')}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="title-section">
                        <PieChart className="header-icon" />
                        <h1>Student Evaluation Overview</h1>
                    </div>
                </div>
                
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or reg number..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="table-wrapper">
                <table className="eval-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Reg Number</th>
                            <th>Guide Name</th>
                            <th>Review 1 (20)</th>
                            <th>Review 2 (20)</th>
                            <th>Review 3 (20)</th>
                            <th className="ce-column-header">CE Mark (Avg / 20)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => {
                                const ceMark = calculateCE(
                                    student.evaluation?.review1_marks,
                                    student.evaluation?.review2_marks,
                                    student.evaluation?.review3_marks
                                );
                                return (
                                    <tr key={student.id}>
                                        <td className="student-name-cell">{student.name}</td>
                                        <td className="reg-num-cell">{student.register_number || 'N/A'}</td>
                                        <td className="guide-name-cell">{student.guide?.name || 'Not Assigned'}</td>
                                        <td className="mark-cell">{student.evaluation?.review1_marks || 0}</td>
                                        <td className="mark-cell">{student.evaluation?.review2_marks || 0}</td>
                                        <td className="mark-cell">{student.evaluation?.review3_marks || 0}</td>
                                        <td className="ce-mark-cell highlight-cell">{ceMark}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="no-data">No students found matching your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoordinatorEvaluation;
