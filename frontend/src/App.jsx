import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import TopicSubmission from './pages/TopicSubmission';
import ReviewMarks from './pages/ReviewMarks';
import ProjectStatus from './pages/ProjectStatus';
import ApprovedAbstracts from './pages/ApprovedAbstracts';
import GuideDashboard from './pages/GuideDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuideAllocation from './pages/GuideAllocation';
import StudentsList from './pages/StudentsList';
import GuidesList from './pages/GuidesList';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/student-dashboard" element={<StudentDashboard />} />
                    <Route path="/student-profile" element={<StudentProfile />} />
                    <Route path="/topic-submission" element={<TopicSubmission />} />
                    <Route path="/project-status" element={<ProjectStatus />} />
                    <Route path="/review-marks" element={<ReviewMarks />} />
                    <Route path="/guide-dashboard" element={<GuideDashboard />} />
                    <Route path="/coordinator-dashboard" element={<CoordinatorDashboard />} />
                    <Route path="/guide-allocation" element={<GuideAllocation />} />
                    <Route path="/students-list" element={<StudentsList />} />
                    <Route path="/guides-list" element={<GuidesList />} />
                    <Route path="/approved-abstracts" element={<ApprovedAbstracts />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
