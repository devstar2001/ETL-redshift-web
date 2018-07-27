from django_celery_beat.models import PeriodicTask
from django.db import models
from django_project.models import TimestampModel
from django.contrib.auth import get_user_model

User = get_user_model()


class Scraper(TimestampModel):
    name = models.CharField(max_length=200)
    site = models.CharField(max_length=200)
    status = models.IntegerField(null=False, blank=False, default=0)
    status_detail = models.TextField(max_length=200, null=True, blank=True, default="")
    upload_path = models.TextField(max_length=200, null=True, blank=True, default="")
    bucket_name = models.TextField(max_length=200, null=True, blank=True, default="")
    table_numbers = models.TextField(max_length=200, null=True, blank=True, default="")
    user = models.ForeignKey(User)
    schedule = models.ForeignKey(PeriodicTask, null=True, blank=True)