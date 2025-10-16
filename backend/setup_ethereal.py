import asyncio
import httpx
import os

async def setup_ethereal():
    """Create Ethereal email account and update .env file"""
    try:
        print("Creating Ethereal email account...")
        async with httpx.AsyncClient() as client:
            response = await client.post("https://api.nodemailer.com/user")
            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ Ethereal Account Created Successfully!")
                print(f"Username: {data['user']}")
                print(f"Password: {data['pass']}")
                print(f"SMTP Host: smtp.ethereal.email")
                print(f"SMTP Port: 587")
                print(f"View emails at: https://ethereal.email/messages")
                
                # Read current .env
                env_file = "/app/backend/.env"
                with open(env_file, "r") as f:
                    env_content = f.read()
                
                # Add SMTP configuration if not exists
                smtp_config = f"""
# SMTP Configuration (Ethereal Email for Testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USERNAME={data['user']}
SMTP_PASSWORD={data['pass']}
SMTP_FROM_EMAIL={data['user']}
SMTP_FROM_NAME=Proleads Network
ADMIN_EMAIL={data['user']}
"""
                
                if "SMTP_HOST" not in env_content:
                    with open(env_file, "a") as f:
                        f.write(smtp_config)
                    print(f"\n✅ SMTP configuration added to .env file")
                else:
                    print(f"\n⚠️ SMTP configuration already exists in .env file")
                
                return data
            else:
                print(f"❌ Failed to create Ethereal account: {response.status_code}")
                return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    asyncio.run(setup_ethereal())
