from api.models import User
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def update_users():
    sneha = User.objects.filter(username='snehasv.mca2426@saintgits.org').first()
    if sneha:
        sneha.department = 'MCA'
        sneha.batch = '2024-2026'
        sneha.save()
        print("Updated Sneha")
    
    aleena = User.objects.filter(username='aleena123@gmail.com').first()
    if aleena:
        aleena.department = 'IMCA'
        aleena.batch = '2022-2027'
        aleena.save()
        print("Updated Aleena")

if __name__ == "__main__":
    update_users()
