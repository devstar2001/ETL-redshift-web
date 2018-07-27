from __future__ import absolute_import, unicode_literals
import os
from celery import Celery, task
from . import settings
from celery import shared_task
from celery.schedules import crontab
# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')

app = Celery('django_project')

# app.conf.broker_url = 'redis://localhost:6379/0'
app.conf.broker_url = 'amqp://localhost'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

# @task()
# def add(x,y):
#     """
#         This function is to be called every minute by celery beat
#     """
#     print("hi from task add", x, y)
#     return x+y
#
# @task(bind=True)
# def debug_task(self):
#     print('Request: {0!r}'.format(self.request))
#
# @task
# def display(s):
#     print("Hello I am celery task.---param: " + s)
#     return 'Hi'+s

