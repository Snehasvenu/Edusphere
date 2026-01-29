from api.models import User
print("---START---")
for s in User.objects.filter(role='STUDENT'):
    gn = "-"
    ge = "-"
    if s.guide:
        gn = f"{s.guide.first_name} {s.guide.last_name}".strip() or s.guide.username
        ge = s.guide.email
    print(f"S:{s.username}|G:{gn}|E:{ge}")
print("---END---")
