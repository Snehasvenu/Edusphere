import os
import django
import sys

# Ensure backend directory is in path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

with open('db_final_check.txt', 'w', encoding='utf-8') as f:
    f.write("STUDENT_REPORT\n")
    for s in User.objects.filter(role='STUDENT'):
        g_name = "NONE"
        g_email = "NONE"
        if s.guide:
            full_name = f"{s.guide.first_name} {s.guide.last_name}".strip()
            g_name = full_name if full_name else f"UN:{s.guide.username}"
            g_email = s.guide.email
        f.write(f"S:{s.username}|G_NAME:{g_name}|G_EMAIL:{g_email}\n")
    
    f.write("\nGUIDE_REPORT\n")
    for g in User.objects.filter(role='GUIDE'):
        full_name = f"{g.first_name} {g.last_name}".strip()
        f.write(f"G:{g.username}|NAME:{full_name}|EMAIL:{g.email}\n")

print("Report written to db_final_check.txt")
