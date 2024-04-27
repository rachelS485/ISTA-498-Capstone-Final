import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import schedule
import time
from datetime import datetime, timedelta

# Email configuration
email_sender = 'kargichauhan2302@gmail.com'
email_password = 'Kargi@2302'
smtp_server = 'smtp.gmail.com'
port = 465  

# Email content
subject = 'Academic Deadline Reminder'
body_template = "Hello, just a reminder that {} is on {}. Please take necessary action if needed."

# Academic dates
academic_dates = {
    'Last day to withdraw, change to/from audit, or for instructors to drop students': '04/24/2024',
    'Last day to file for Grade Replacement Opportunity': '11/3/2024',
    'Last day for department staff to add or drop': '9/22/2024',
    'Last day to drop without a W, and to change credit/audit status': '9/8/2024',
    'Last day for class additions and changes via UAccess': '9/2/2024',
    'First day of Fall classes and other activities': '8/26/2024'
}

def send_email(recipient, subject, body):
    message = MIMEMultipart()
    message['From'] = email_sender
    message['To'] = recipient
    message['Subject'] = subject

    message.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP(smtp_server, port)
    server.starttls()
    server.login(email_sender,email_password)
    text = message.as_string()
    server.sendmail(email_sender, recipient, text)
    server.quit()

def schedule_emails():
    for event, date_str in academic_dates.items():
        date_obj = datetime.strptime(date_str, '%m/%d/%Y')
        reminder_date = date_obj - timedelta(days=1)
        event_body = body_template.format(event, date_str)

        # Schedule the email
        schedule.every().day.at(reminder_date.strftime('23:47')).do(send_email, 
            recipient='kargichauhan2302@gmail.com', 
            subject=subject, 
            body=event_body)

        print(f"Scheduled an email for {event} on {reminder_date.strftime('%Y-%m-%d 23:47')}")

# Run the scheduler
schedule_emails()
while True:
    schedule.run_pending()
    time.sleep(1)  
