import os
import django
import sys
import json

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import StudentProfile, FacultyProfile
from rest_framework.test import APIRequestFactory
from api.views import AssignGuideView

User = get_user_model()
factory = APIRequestFactory()

def test_allocation():
    print("--- Starting Allocation Debug ---")
    
    # 1. Setup Test Data
    print("1. Finding/Creating Test Users...")
    student_user = User.objects.filter(role='STUDENT').first()
    guide_user = User.objects.filter(role='GUIDE').first()
    
    if not student_user or not guide_user:
        print("!! ERROR: Need at least one student and one guide in DB to test.")
        return

    print(f"   Student: {student_user.username} (ID: {student_user.id})")
    print(f"   Guide: {guide_user.username} (ID: {guide_user.id})")

    # Ensure profile exists
    if not hasattr(student_user, 'student_profile'):
        print("   Creating missing StudentProfile...")
        StudentProfile.objects.create(user=student_user)
    
    # Clear current guide
    print("2. Clearing existing guide for student...")
    profile = student_user.student_profile
    profile.guide = None
    profile.save()
    
    # 3. Test Assignment API
    print("3. Testing API Call...")
    view = AssignGuideView.as_view()
    data = {'student_id': student_user.id, 'guide_id': guide_user.id}
    request = factory.post('/api/assign-guide/', data, format='json')
    response = view(request)
    
    print(f"   Response Code: {response.status_code}")
    print(f"   Response Data: {response.data}")
    
    if response.status_code == 200:
        print("   API Success! Verifying DB...")
        profile.refresh_from_db()
        if profile.guide == guide_user:
            print("   SUCCESS: Database updated correctly.")
        else:
            print("   FAIL: Database did NOT update.")
    else:
        print("   FAIL: API returned error.")

if __name__ == "__main__":
    test_allocation()
