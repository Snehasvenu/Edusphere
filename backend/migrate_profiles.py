import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from api.models import User, StudentProfile, FacultyProfile

def migrate_data():
    print("Starting data migration...")
    users = User.objects.all()
    
    for user in users:
        print(f"Processing user: {user.username} ({user.role})")
        
        # Check if profile already exists to avoid duplicates
        # Using try-except for OneToOne access as it raises specific exceptions if missing
        has_student = False
        has_faculty = False
        
        try:
            if user.student_profile: has_student = True
        except User.student_profile.RelatedObjectDoesNotExist:
            has_student = False
            
        try:
            if user.faculty_profile: has_faculty = True
        except User.faculty_profile.RelatedObjectDoesNotExist:
            has_faculty = False
            
        if has_student or has_faculty:
            print(f"  Profile already exists for {user.username}, skipping.")
            continue
            
        if user.role == 'STUDENT':
            # Create StudentProfile
            StudentProfile.objects.create(
                user=user,
                department=user.department,
                batch=user.batch,
                register_number=user.register_number,
                guide=user.guide
            )
            print(f"  Created StudentProfile for {user.username}")
            
        elif user.role in ['GUIDE', 'COORDINATOR', 'ADMIN']:
            # Create FacultyProfile
            # Designation logic: map role to designation
            designation = user.get_role_display() # e.g. 'Project Guide', 'Project Coordinator'
            
            FacultyProfile.objects.create(
                user=user,
                department=user.department,
                designation=designation
            )
            print(f"  Created FacultyProfile for {user.username}")
            
    print("Migration completed successfully.")

if __name__ == '__main__':
    migrate_data()
