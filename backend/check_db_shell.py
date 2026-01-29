from api.models import User

def check_guides():
    print("--- Students and their Guides ---")
    students = User.objects.filter(role='STUDENT')
    for s in students:
        guide_info = "None"
        if s.guide:
            full_name = f"{s.guide.first_name} {s.guide.last_name}".strip()
            name_to_display = full_name if full_name else s.guide.username
            guide_info = f"{name_to_display} ({s.guide.email})"
        
        print(f"Student: {s.username} | Name: {s.first_name} {s.last_name} | Guide: {guide_info}")

    print("\n--- All Guides ---")
    guides = User.objects.filter(role='GUIDE')
    for g in guides:
        full_name = f"{g.first_name} {g.last_name}".strip()
        print(f"Guide: {g.username} | Name: '{full_name}' | First: '{g.first_name}' | Last: '{g.last_name}' | Email: {g.email}")

check_guides()
