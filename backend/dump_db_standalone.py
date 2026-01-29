import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

def dump_db():
    with open('db_dump.txt', 'w') as f:
        f.write("--- Students and their Guides ---\n")
        students = User.objects.filter(role='STUDENT')
        for s in students:
            guide_info = "None"
            if s.guide:
                full_name = f"{s.guide.first_name} {s.guide.last_name}".strip()
                name_to_display = full_name if full_name else s.guide.username
                guide_info = f"{name_to_display} ({s.guide.email})"
            
            f.write(f"Student: {s.username} | Name: {s.first_name} {s.last_name} | Guide: {guide_info}\n")

        f.write("\n--- All Guides ---\n")
        guides = User.objects.filter(role='GUIDE')
        for g in guides:
            full_name = f"{g.first_name} {g.last_name}".strip()
            f.write(f"Guide: {g.username} | Name: '{full_name}' | First: '{g.first_name}' | Last: '{g.last_name}' | Email: {g.email}\n")

if __name__ == "__main__":
    dump_db()
    print("Dump completed to db_dump.txt")
