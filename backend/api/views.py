import re
from PyPDF2 import PdfReader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework.parsers import MultiPartParser, FormParser
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import ProjectSubmission, Evaluation, ProjectProgress, StudentProfile, FacultyProfile, Notification
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

User = get_user_model()

def extract_text_from_pdf(file_obj):
    try:
        file_obj.seek(0)
        reader = PdfReader(file_obj)
        text = ''
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + ' '
        return text
    except Exception:
        return ''

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    # Tokenize
    try:
        words = word_tokenize(text)
    except LookupError:
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        words = word_tokenize(text)
        
    # Remove stopwords
    try:
        stop_words = set(stopwords.words('english'))
    except LookupError:
        nltk.download('stopwords', quiet=True)
        stop_words = set(stopwords.words('english'))
        
    # Specifically add requested words if not already in set (they usually are)
    custom_stops = {'the', 'is', 'for', 'and', 'of', 'in'}
    stop_words = stop_words.union(custom_stops)
    
    filtered_words = [word for word in words if word not in stop_words and len(word) > 1]
    return ' '.join(filtered_words)

def compute_duplicate_info(submission_text, approved_pairs, threshold=0.80):
    corpus = [text for _, text in approved_pairs] + [submission_text]
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return 0, None

    if matrix.shape[0] <= 1:
        return 0, None

    cosine_matrix = cosine_similarity(matrix[-1], matrix[:-1])
    if cosine_matrix.size == 0:
        return 0, None

    best_score = float(cosine_matrix.max())
    best_idx = int(cosine_matrix.argmax())

    if best_score >= threshold:
        return best_score, approved_pairs[best_idx][0]
    return best_score, None

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

        uploaded_abstract_text = ''
        uploaded_abstract_source = None
        if 'abstract1' in request.FILES:
            submission.abstract1 = request.FILES['abstract1']
            uploaded_abstract_source = 'abstract1'
        if 'abstract2' in request.FILES:
            submission.abstract2 = request.FILES['abstract2']
            uploaded_abstract_source = 'abstract2'
        if 'abstract3' in request.FILES:
            submission.abstract3 = request.FILES['abstract3']
            uploaded_abstract_source = 'abstract3'

        submission.save()

        if uploaded_abstract_source:
            file_field = getattr(submission, uploaded_abstract_source)
            if file_field:
                abstract_file = file_field.open('rb')
                raw_text = extract_text_from_pdf(abstract_file)
                abstract_file.close()
                normalized_text = normalize_text(raw_text)

                approved_subs = ProjectSubmission.objects.filter(status='APPROVED').exclude(approved_abstract__isnull=True)
                approved_pairs = []
                for approved in approved_subs:
                    abstract_path = None
                    if approved.approved_abstract == 1 and approved.abstract1:
                        abstract_path = approved.abstract1.path
                    elif approved.approved_abstract == 2 and approved.abstract2:
                        abstract_path = approved.abstract2.path
                    elif approved.approved_abstract == 3 and approved.abstract3:
                        abstract_path = approved.abstract3.path

                    if abstract_path:
                        try:
                            with open(abstract_path, 'rb') as f:
                                approved_text = normalize_text(extract_text_from_pdf(f))
                                if approved_text.strip():
                                    approved_pairs.append((approved.project_title or 'Untitled', approved_text))
                        except Exception:
                            continue

                score, matched_title = compute_duplicate_info(normalized_text, approved_pairs)
                score_percent = int(score * 100)

                submission.similarity_score = score_percent
                submission.duplicate_project_title = matched_title if score >= 0.80 else None
                submission.duplicate_warning = score >= 0.80

                if score >= 0.80:
                    duplicate_message = (
                        f"Warning: A similar project abstract already exists in the system. "
                        f"Similar Project Title: {matched_title or 'Unknown'}; Similarity: {score_percent}%"
                    )
                    submission.status = 'REVISION'
                    
                    warning_msg = (
                        f"A similarity has been detected between the submitted project abstract and an existing project in the system.\n\n"
                        f"Project title: {submission.project_title or 'Untitled'}\n"
                        f"Similar existing project title: {matched_title or 'Unknown'}\n"
                        f"Similarity percentage: {score_percent}%\n"
                        f"Warning message: Please revise your abstract to ensure originality."
                    )
                    
                    # Store remarks for the frontend
                    submission.remarks = (submission.remarks or '') + '\n' + warning_msg

                    # Notification to student
                    Notification.objects.create(
                        recipient=user,
                        submission=submission,
                        subject='Duplicate Project Abstract Detected',
                        message=warning_msg
                    )
                    
                    # Notification to guide
                    if user.guide:
                        Notification.objects.create(
                            recipient=user.guide,
                            submission=submission,
                            subject='Duplicate Project Abstract Detected',
                            message=warning_msg
                        )
                else:
                    duplicate_message = 'No potential duplicate found; abstract accepted for review.'

                    # Optionally notify coordinator/admin (first coordinator found)
                    coordinator = User.objects.filter(role='COORDINATOR').first() or User.objects.filter(role='ADMIN').first()
                    if coordinator:
                        Notification.objects.create(
                            recipient=coordinator,
                            submission=submission,
                            subject='Project Abstract Submitted',
                            message=f"A new project abstract has been submitted by {submission.project_title or 'Untitled'}."
                        )

                submission.save()

                return Response({
                    'message': 'Submission updated successfully',
                    'similarity_score': score_percent,
                    'duplicate_warning': submission.duplicate_warning,
                    'duplicate_project_title': submission.duplicate_project_title,
                    'matched_project_title': matched_title,
                    'duplicate_message': duplicate_message
                }, status=status.HTTP_200_OK)

        # No abstract just save metadata
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
                'review3_marks': 'Not Evaluated',
                'project_progress_marks': 'Not Evaluated',
                'scrum_git_marks': 'Not Evaluated',
                'presentation_marks': 'Not Evaluated',
                'r2_project_progress_marks': 'Not Evaluated',
                'r2_presentation_marks': 'Not Evaluated',
                'r2_ui_creation_marks': 'Not Evaluated',
                'r3_project_progress_marks': 'Not Evaluated',
                'r3_ui_creation_marks': 'Not Evaluated',
                'r3_testing_methods_marks': 'Not Evaluated',
                'updated_at': None
            })
            
        return Response({
            'review1_marks': f"{eval.review1_marks}" if eval.review1_marks is not None else 'Not Evaluated',
            'review2_marks': f"{eval.review2_marks}" if eval.review2_marks is not None else 'Not Evaluated',
            'review3_marks': f"{eval.review3_marks}" if eval.review3_marks is not None else 'Not Evaluated',
            'project_progress_marks': f"{eval.project_progress_marks}" if eval.project_progress_marks is not None else 'Not Evaluated',
            'scrum_git_marks': f"{eval.scrum_git_marks}" if eval.scrum_git_marks is not None else 'Not Evaluated',
            'presentation_marks': f"{eval.presentation_marks}" if eval.presentation_marks is not None else 'Not Evaluated',
            'r2_project_progress_marks': f"{eval.r2_project_progress_marks}" if eval.r2_project_progress_marks is not None else 'Not Evaluated',
            'r2_presentation_marks': f"{eval.r2_presentation_marks}" if eval.r2_presentation_marks is not None else 'Not Evaluated',
            'r2_ui_creation_marks': f"{eval.r2_ui_creation_marks}" if eval.r2_ui_creation_marks is not None else 'Not Evaluated',
            'r3_project_progress_marks': f"{eval.r3_project_progress_marks}" if eval.r3_project_progress_marks is not None else 'Not Evaluated',
            'r3_ui_creation_marks': f"{eval.r3_ui_creation_marks}" if eval.r3_ui_creation_marks is not None else 'Not Evaluated',
            'r3_testing_methods_marks': f"{eval.r3_testing_methods_marks}" if eval.r3_testing_methods_marks is not None else 'Not Evaluated',
            'updated_at': eval.updated_at.isoformat() if eval.updated_at else None,
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
            # Get evaluation info if exists
            evaluation = Evaluation.objects.filter(student=student).first()

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
                } if project else None,
                'evaluation': {
                    'review1_marks': evaluation.review1_marks if evaluation else 0,
                    'review2_marks': evaluation.review2_marks if evaluation else 0,
                    'review3_marks': evaluation.review3_marks if evaluation else 0,
                    'project_progress_marks': evaluation.project_progress_marks if evaluation else 0,
                    'scrum_git_marks': evaluation.scrum_git_marks if evaluation else 0,
                    'presentation_marks': evaluation.presentation_marks if evaluation else 0,
                    'r2_project_progress_marks': evaluation.r2_project_progress_marks if evaluation else 0,
                    'r2_presentation_marks': evaluation.r2_presentation_marks if evaluation else 0,
                    'r2_ui_creation_marks': evaluation.r2_ui_creation_marks if evaluation else 0,
                    'r3_project_progress_marks': evaluation.r3_project_progress_marks if evaluation else 0,
                    'r3_ui_creation_marks': evaluation.r3_ui_creation_marks if evaluation else 0,
                    'r3_testing_methods_marks': evaluation.r3_testing_methods_marks if evaluation else 0,
                } if evaluation else None
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
        
        def parse_mark(val):
            try:
                if val is None or str(val).strip() == '':
                    return None
                return float(val)
            except ValueError:
                return None
                
        marks1_prog = parse_mark(request.data.get('project_progress_marks'))
        marks1_scrum = parse_mark(request.data.get('scrum_git_marks'))
        marks1_pres = parse_mark(request.data.get('presentation_marks'))
        
        marks2_prog = parse_mark(request.data.get('r2_project_progress_marks'))
        marks2_pres = parse_mark(request.data.get('r2_presentation_marks'))
        marks2_ui = parse_mark(request.data.get('r2_ui_creation_marks'))
        
        marks3_prog = parse_mark(request.data.get('r3_project_progress_marks'))
        marks3_ui = parse_mark(request.data.get('r3_ui_creation_marks'))
        marks3_test = parse_mark(request.data.get('r3_testing_methods_marks'))
        
        marks2 = parse_mark(request.data.get('review2_marks'))
        marks3 = parse_mark(request.data.get('review3_marks'))
        
        user = User.objects.filter(email=student_email).first()
        if not user:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
            
        eval_obj, created = Evaluation.objects.get_or_create(student=user)
        
        if marks1_prog is not None: eval_obj.project_progress_marks = marks1_prog
        if marks1_scrum is not None: eval_obj.scrum_git_marks = marks1_scrum
        if marks1_pres is not None: eval_obj.presentation_marks = marks1_pres
        
        if marks2_prog is not None: eval_obj.r2_project_progress_marks = marks2_prog
        if marks2_pres is not None: eval_obj.r2_presentation_marks = marks2_pres
        if marks2_ui is not None: eval_obj.r2_ui_creation_marks = marks2_ui
        
        if marks3_prog is not None: eval_obj.r3_project_progress_marks = marks3_prog
        if marks3_ui is not None: eval_obj.r3_ui_creation_marks = marks3_ui
        if marks3_test is not None: eval_obj.r3_testing_methods_marks = marks3_test
        
        # Calculate review1_marks total if any of the three are provided
        if any(x is not None for x in [marks1_prog, marks1_scrum, marks1_pres]):
            prog = float(eval_obj.project_progress_marks or 0)
            scrum = float(eval_obj.scrum_git_marks or 0)
            pres = float(eval_obj.presentation_marks or 0)
            eval_obj.review1_marks = prog + scrum + pres
        else:
            # Fallback if only review1_marks is directly sent
            marks1 = parse_mark(request.data.get('review1_marks'))
            if marks1 is not None: eval_obj.review1_marks = marks1
            
        # Calculate review2_marks total if any of the three are provided
        if any(x is not None for x in [marks2_prog, marks2_pres, marks2_ui]):
            prog2 = float(eval_obj.r2_project_progress_marks or 0)
            pres2 = float(eval_obj.r2_presentation_marks or 0)
            ui2 = float(eval_obj.r2_ui_creation_marks or 0)
            eval_obj.review2_marks = prog2 + pres2 + ui2
        else:
            if marks2 is not None: eval_obj.review2_marks = marks2

        # Calculate review3_marks total if any of the three are provided
        if any(x is not None for x in [marks3_prog, marks3_ui, marks3_test]):
            prog3 = float(eval_obj.r3_project_progress_marks or 0)
            ui3 = float(eval_obj.r3_ui_creation_marks or 0)
            test3 = float(eval_obj.r3_testing_methods_marks or 0)
            eval_obj.review3_marks = prog3 + ui3 + test3
        else:
            if marks3 is not None: eval_obj.review3_marks = marks3

        eval_obj.save()
        
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

            # Get evaluation info if exists
            evaluation = Evaluation.objects.filter(student=student).first()

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
                } if guide_obj else None,
                'evaluation': {
                    'review1_marks': float(evaluation.review1_marks or 0),
                    'review2_marks': float(evaluation.review2_marks or 0),
                    'review3_marks': float(evaluation.review3_marks or 0),
                } if evaluation else {
                    'review1_marks': 0,
                    'review2_marks': 0,
                    'review3_marks': 0,
                }
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

        # Allow re-assignment (overwrite existing guide)
        # if profile.guide:
        #    return Response({
        #        'error': f'Student is already assigned to {profile.guide.first_name}'
        #    }, status=status.HTTP_400_BAD_REQUEST)
        
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

class DuplicateCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        threshold = float(request.query_params.get('threshold', 80)) / 100.0
        duplicate_submissions = ProjectSubmission.objects.filter(similarity_score__gte=int(threshold * 100))

        results = []
        for submission in duplicate_submissions:
            try:
                student_name = f"{submission.student.first_name} {submission.student.last_name}".strip() or submission.student.username
                try:
                    guide = submission.student.student_profile.guide
                    guide_name = f"{guide.first_name} {guide.last_name}".strip() if guide else 'Not Assigned'
                except Exception:
                    guide_name = 'Not Assigned'
            except Exception:
                student_name = 'Unknown'
                guide_name = 'Unknown'

            results.append({
                'student_name': student_name,
                'student_email': submission.student.email,
                'project_title': submission.project_title,
                'similarity_score': submission.similarity_score,
                'duplicate_project_title': submission.duplicate_project_title,
                'status': submission.status,
                'guide_name': guide_name,
                'remarks': submission.remarks
            })

        return Response(results, status=status.HTTP_200_OK)

class NotificationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
        data = [
            {
                'subject': n.subject,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for n in notifications
        ]

        return Response(data, status=status.HTTP_200_OK)

