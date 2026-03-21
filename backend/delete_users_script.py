import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

with open('deletion_log.txt', 'w') as f:
    targets = ['aleena', 'sneha', 'students']
    f.write(f"Attempting deletion for keywords: {targets}\n\n")
    
    for target in targets:
        f.write(f"Searching for '{target}'...\n")
        users = User.objects.filter(username__icontains=target)
        if users.exists():
            for user in users:
                f.write(f"Found and deleting: {user.username} (ID: {user.id})\n")
                user.delete()
        else:
            f.write(f"No users found containing '{target}'\n")
            
    f.write("\nRemaining users:\n")
    for u in User.objects.all():
        f.write(f"- {u.username}\n")

print("Done. Check deletion_log.txt")
