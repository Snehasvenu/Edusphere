from django.urls import path
from .views import (
    LoginView, RegisterView, StudentProfileView, TopicSubmissionView, 
    EvaluationView, AlottedStudentsView, UpdateProjectStatusView, 
    UpdateEvaluationView, StudentsListView, GuidesListView, 
    AssignGuideView, AutoAllocateGuidesView, ProjectProgressView,
    ApprovedAbstractsView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', StudentProfileView.as_view(), name='profile'),
    path('submit-topics/', TopicSubmissionView.as_view(), name='submit-topics'),
    path('evaluation/', EvaluationView.as_view(), name='evaluation'),
    path('alotted-students/', AlottedStudentsView.as_view(), name='alotted-students'),
    path('update-topic-status/', UpdateProjectStatusView.as_view(), name='update-topic-status'),
    path('update-evaluation/', UpdateEvaluationView.as_view(), name='update-evaluation'),
    # Guide Allocation endpoints
    path('students/', StudentsListView.as_view(), name='students-list'),
    path('guides/', GuidesListView.as_view(), name='guides-list'),
    path('assign-guide/', AssignGuideView.as_view(), name='assign-guide'),
    path('auto-allocate-guides/', AutoAllocateGuidesView.as_view(), name='auto-allocate-guides'),
    path('progress/', ProjectProgressView.as_view(), name='progress'),
    path('approved-abstracts/', ApprovedAbstractsView.as_view(), name='approved-abstracts'),
]
