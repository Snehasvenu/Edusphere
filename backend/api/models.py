from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('GUIDE', 'Project Guide'),
        ('COORDINATOR', 'Project Coordinator'),
        ('ADMIN', 'Admin'),
    )
    DEPARTMENT_CHOICES = (
        ('MCA', 'MCA'),
        ('IMCA', 'IMCA'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    department = models.CharField(max_length=10, choices=DEPARTMENT_CHOICES, null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True) # e.g., 2023-2025
    register_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    guide = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    def __str__(self):
        return f"{self.username} ({self.role})"

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    department = models.CharField(max_length=10, choices=User.DEPARTMENT_CHOICES, null=True, blank=True)
    batch = models.CharField(max_length=20, null=True, blank=True)
    register_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    guide = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='allocated_students')

    def __str__(self):
        return f"Profile for {self.user.username}"

class FacultyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    department = models.CharField(max_length=10, choices=User.DEPARTMENT_CHOICES, null=True, blank=True)
    designation = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Faculty Profile for {self.user.username}"

class ProjectSubmission(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='project_submission')
    project_title = models.CharField(max_length=255, null=True, blank=True)
    abstract1 = models.FileField(upload_to='abstracts/', null=True, blank=True)
    abstract2 = models.FileField(upload_to='abstracts/', null=True, blank=True)
    abstract3 = models.FileField(upload_to='abstracts/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=(('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('REVISION', 'Revision Required')), default='PENDING')
    approved_abstract = models.IntegerField(null=True, blank=True) # 1, 2, or 3
    duplicate_project_title = models.CharField(max_length=255, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    similarity_score = models.IntegerField(default=0)
    duplicate_warning = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Submission by {self.student.username}"

class Evaluation(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='evaluation')
    project_progress_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    scrum_git_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    presentation_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    review1_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r2_project_progress_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r2_presentation_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r2_ui_creation_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    review2_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r3_project_progress_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r3_ui_creation_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    r3_testing_methods_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    review3_marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Evaluation for {self.student.username}"

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    submission = models.ForeignKey(ProjectSubmission, on_delete=models.CASCADE, related_name='notifications')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.recipient.email}: {self.subject}"

class ProjectProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_logs')
    stage = models.CharField(max_length=255)
    description = models.TextField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.student.username} - {self.stage}"
