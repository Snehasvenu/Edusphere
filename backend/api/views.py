from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ProjectSubmission, Evaluation, ProjectProgress, StudentProfile, FacultyProfile

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt for username: '{username}'")
        # print(f"Password provided: '{password}'") # Uncomment for extreme debugging only

        user = authenticate(username=username, password=password)
        print(f"Authentication result: {user}")
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'role': user.role,
                'username': user.username
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')
        role = request.data.get('role', 'STUDENT')
        register_number = request.data.get('register_number')
        department = request.data.get('department')
        batch = request.data.get('batch')
        
        if register_number == '':
            register_number = None

        if not all([email, password, name]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if role.upper() == 'ADMIN':
            return Response({'error': 'Admin accounts cannot be self-registered'}, status=status.HTTP_403_FORBIDDEN)

        # Use email as username
        username = email

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        if register_number and User.objects.filter(register_number=register_number).exists():
            return Response({'error': 'Register number already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=name,
                role=role
            )
            
            if role == 'STUDENT':
                StudentProfile.objects.create(
                    user=user,
                    department=department,
                    batch=batch,
                    register_number=register_number
                )
            elif role in ['GUIDE', 'COORDINATOR', 'ADMIN']:
                FacultyProfile.objects.create(
                    user=user,
                    department=department,
                    # designation can be mapped map role if needed
                )
            
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentProfileView(APIView):
    # For now, let's use a simpler way since user might not have token logic fully working in frontend
    # But I'll stick to rest framework standards
    def get(self, request):
        # In a real app we'd use request.user
        # For this demo, let's assume we pass the username/email in params if request.user is anonymous
        email = request.query_params.get('email')
        if email:
            user = User.objects.filter(email=email).first()
        else:
            user = request.user
            
        if not user or user.is_anonymous:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Prepare guide info
        guide_name = 'Not Yet Allotted'
        guide_email = None
        
        department = None
        guide = None
        
        try:
            profile = user.student_profile
            department = profile.department
            guide = profile.guide
        except StudentProfile.DoesNotExist:
            pass
        
        if guide:
            # Robust Fallback chain: full name -> first name -> username -> email
            g = guide
            full_name = f"{g.first_name} {g.last_name}".strip()
            
            if full_name:
                guide_name = full_name
            elif g.first_name:
                guide_name = g.first_name
            elif g.username:
                guide_name = g.username
            elif g.email:
                guide_name = g.email
            else:
                guide_name = "Guide Assigned (Name Unavailable)"
                
            guide_email = g.email or "No Email Provided"

        return Response({
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'department': department,
            'guide_name': guide_name,
            'guide_email': guide_email
        }, status=status.HTTP_200_OK)

class TopicSubmissionView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        submission, created = ProjectSubmission.objects.get_or_create(student=user)
        
        if 'project_title' in request.data:
            submission.project_title = request.data.get('project_title')
            
        if 'abstract1' in request.FILES:
            submission.abstract1 = request.FILES['abstract1']
        if 'abstract2' in request.FILES:
            submission.abstract2 = request.FILES['abstract2']
        if 'abstract3' in request.FILES:
            submission.abstract3 = request.FILES['abstract3']
            
        submission.save()
        return Response({'message': 'Submission updated successfully'}, status=status.HTTP_200_OK)
        
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        submission = ProjectSubmission.objects.filter(student=user).first()
        if not submission:
            return Response({
                'abstract1': None,
                'abstract2': None,
                'abstract3': None
            })
            
        return Response({
            'project_title': submission.project_title,
            'abstract1': submission.abstract1.name if submission.abstract1 else None,
            'abstract2': submission.abstract2.name if submission.abstract2 else None,
            'abstract3': submission.abstract3.name if submission.abstract3 else None,
            'status': submission.status,
            'remarks': submission.remarks
        })

class EvaluationView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        eval = Evaluation.objects.filter(student=user).first()
        if not eval:
            return Response({
                'review1_marks': 'Not Evaluated',
                'review2_marks': 'Not Evaluated',
                'review3_marks': 'Not Evaluated'
            })
            
        return Response({
            'review1_marks': f"{eval.review1_marks}" if eval.review1_marks is not None else 'Not Evaluated',
            'review2_marks': f"{eval.review2_marks}" if eval.review2_marks is not None else 'Not Evaluated',
            'review3_marks': f"{eval.review3_marks}" if eval.review3_marks is not None else 'Not Evaluated',
        })

class AlottedStudentsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        guide = User.objects.filter(email=email, role='GUIDE').first()
        if not guide:
            return Response({'error': 'Guide not found'}, status=status.HTTP_404_NOT_FOUND)
            
        students = User.objects.filter(student_profile__guide=guide, role='STUDENT')
        
        student_list = []
        for student in students:
            # Get project info if exists
            project = ProjectSubmission.objects.filter(student=student).first()
            
            try: 
                profile = student.student_profile
                dept = profile.department
                batch = profile.batch
                reg_num = profile.register_number
            except: 
                dept = None
                batch = None
                reg_num = None

            student_list.append({
                'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'email': student.email,
                'register_number': reg_num,
                'department': dept,
                'batch': batch,
                'id': student.id,
                'project': {
                    'title': project.project_title if project else 'Not Submitted',
                    'status': project.status if project else 'PENDING',
                    'abstract1': project.abstract1.url if project and project.abstract1 else None,
                    'abstract2': project.abstract2.url if project and project.abstract2 else None,
                    'abstract3': project.abstract3.url if project and project.abstract3 else None,
                    'remarks': project.remarks if project else '',
                    'similarity_score': project.similarity_score if project else 0,
                    'approved_abstract': project.approved_abstract if project else None
                } if project else None
            })
            
        return Response(student_list, status=status.HTTP_200_OK)

class UpdateProjectStatusView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        student_email = request.data.get('email')
        status_val = request.data.get('status') # APPROVED, REJECTED, REVISION
        remarks = request.data.get('remarks')
        approved_abstract = request.data.get('approved_abstract') # 1, 2, or 3
        
        user = User.objects.filter(email=student_email).first()
        if not user:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
        submission = ProjectSubmission.objects.filter(student=user).first()
        if not submission:
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)
            
        submission.status = status_val
        submission.remarks = remarks
        if status_val == 'APPROVED':
            submission.approved_abstract = approved_abstract
        else:
            submission.approved_abstract = None
            
        submission.save()
        
        return Response({'message': 'Status updated successfully'})

class UpdateEvaluationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        student_email = request.data.get('email')
        marks1 = request.data.get('review1_marks')
        marks2 = request.data.get('review2_marks')
        marks3 = request.data.get('review3_marks')
        
        user = User.objects.filter(email=student_email).first()
        if not user:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
        eval, created = Evaluation.objects.get_or_create(student=user)
        if marks1 is not None: eval.review1_marks = marks1
        if marks2 is not None: eval.review2_marks = marks2
        if marks3 is not None: eval.review3_marks = marks3
        eval.save()
        
        return Response({'message': 'Evaluation updated successfully'})

class StudentsListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        students = User.objects.filter(role='STUDENT')
        
        student_list = []
        student_list = []
        for student in students:
            try: 
                profile = student.student_profile
                dept = profile.department
                batch = profile.batch
                reg_num = profile.register_number
                guide_obj = profile.guide
            except: 
                dept = None
                batch = None
                reg_num = None
                guide_obj = None

            student_list.append({
                'id': student.id,
                'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'email': student.email,
                'register_number': reg_num,
                'department': dept,
                'batch': batch,
                'guide': {
                    'id': guide_obj.id,
                    'name': f"{guide_obj.first_name} {guide_obj.last_name}".strip() or guide_obj.username
                } if guide_obj else None
            })
        
        return Response(student_list, status=status.HTTP_200_OK)

class GuidesListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        guides = User.objects.filter(role='GUIDE')
        
        guide_list = []
        for guide in guides:
            students = User.objects.filter(student_profile__guide=guide, role='STUDENT')
            
            student_list_data = []
            for s in students:
                try: reg_num = s.student_profile.register_number
                except: reg_num = None
                
                student_list_data.append({
                    'id': s.id,
                    'name': f"{s.first_name} {s.last_name}".strip() or s.username,
                    'register_number': reg_num
                })

            guide_list.append({
                'id': guide.id,
                'name': f"{guide.first_name} {guide.last_name}".strip() or guide.username,
                'email': guide.email,
                'student_count': students.count(),
                'students': student_list_data
            })
        
        return Response(guide_list, status=status.HTTP_200_OK)

class AssignGuideView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        student_id = request.data.get('student_id')
        guide_id = request.data.get('guide_id')
        
        if not student_id or not guide_id:
            return Response({'error': 'Both student_id and guide_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch student
        student = User.objects.filter(id=student_id, role='STUDENT').first()
        if not student:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Fetch guide
        guide = User.objects.filter(id=guide_id, role='GUIDE').first()
        if not guide:
            return Response({'error': 'Guide not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if student already has a guide
        try:
            profile = student.student_profile
        except:
             return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if profile.guide:
            return Response({
                'error': f'Student is already assigned to {profile.guide.first_name}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Assign guide to student
        profile.guide = guide
        profile.save()
        
        return Response({
            'message': 'Student successfully assigned to guide',
            'student': f"{student.first_name} {student.last_name}".strip() or student.username,
            'guide': f"{guide.first_name} {guide.last_name}".strip() or guide.username
        }, status=status.HTTP_200_OK)

class AutoAllocateGuidesView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        department = request.data.get('department')  # Optional filter
        
        # Get all unassigned students
        unassigned_students = User.objects.filter(role='STUDENT', student_profile__guide__isnull=True)
        if department:
            unassigned_students = unassigned_students.filter(student_profile__department=department)
        
        if not unassigned_students.exists():
            return Response({'message': 'No unassigned students found'}, status=status.HTTP_200_OK)
        
        # Get all guides
        guides = User.objects.filter(role='GUIDE')
        if department:
            guides = guides.filter(faculty_profile__department=department)
        
        if not guides.exists():
            return Response({'error': 'No guides available for allocation'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Sort guides by current student count (ascending) for balanced allocation
        guides_with_counts = []
        for guide in guides:
            student_count = User.objects.filter(student_profile__guide=guide, role='STUDENT').count()
            guides_with_counts.append({'guide': guide, 'count': student_count})
        
        guides_with_counts.sort(key=lambda x: x['count'])
        
        # Perform round-robin allocation
        allocations = []
        guide_index = 0
        
        for student in unassigned_students:
            guide_obj = guides_with_counts[guide_index]['guide']
            
            # Update profile
            try:
                profile = student.student_profile
                profile.guide = guide_obj
                profile.save()
            except:
                continue

            allocations.append({
                'student': f"{student.first_name} {student.last_name}".strip() or student.username,
                'guide': f"{guide_obj.first_name} {guide_obj.last_name}".strip() or guide_obj.username
            })
            
            # Update count and move to next guide
            guides_with_counts[guide_index]['count'] += 1
            guide_index = (guide_index + 1) % len(guides_with_counts)
            
            # Re-sort to maintain balance
            guides_with_counts.sort(key=lambda x: x['count'])
            guide_index = 0  # Reset to guide with lowest count
        
        return Response({
            'message': f'Successfully allocated {len(allocations)} students to {len(guides_with_counts)} guides',
            'allocations': allocations
        }, status=status.HTTP_200_OK)

class ProjectProgressView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        logs = ProjectProgress.objects.filter(student=user)
        log_data = [{
            'id': log.id,
            'stage': log.stage,
            'description': log.description,
            'completed_at': log.completed_at.strftime('%Y-%m-%d %H:%M')
        } for log in logs]
        
        return Response(log_data, status=status.HTTP_200_OK)
        
    def post(self, request):
        email = request.data.get('email')
        stage = request.data.get('stage')
        description = request.data.get('description')
        
        if not all([email, stage, description]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        log = ProjectProgress.objects.create(
            student=user,
            stage=stage,
            description=description
        )
        
        return Response({'message': 'Progress log added successfully'}, status=status.HTTP_201_CREATED)

class ApprovedAbstractsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Fetch all students with APPROVED status
        approved_submissions = ProjectSubmission.objects.filter(status='APPROVED').select_related('student', 'student__guide')
        
        abstracts_data = []
        for submission in approved_submissions:
            student = submission.student
            
            try:
                profile = student.student_profile
                guide = profile.guide
                reg_num = profile.register_number
                dept = profile.department
            except:
                guide = None
                reg_num = 'N/A'
                dept = 'N/A'
            
            # Get the approved abstract file
            approved_abstract_file = None
            if submission.approved_abstract == 1:
                approved_abstract_file = submission.abstract1.url if submission.abstract1 else None
            elif submission.approved_abstract == 2:
                approved_abstract_file = submission.abstract2.url if submission.abstract2 else None
            elif submission.approved_abstract == 3:
                approved_abstract_file = submission.abstract3.url if submission.abstract3 else None
            
            abstracts_data.append({
                'student_name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'register_number': reg_num or 'N/A',
                'department': dept or 'N/A',
                'abstract_url': approved_abstract_file,
                'guide_name': f"{guide.first_name} {guide.last_name}".strip() if guide else 'Not Assigned',
                'approval_date': submission.submitted_at.strftime('%Y-%m-%d') if submission.submitted_at else 'N/A'
            })
        
        return Response(abstracts_data, status=status.HTTP_200_OK)

