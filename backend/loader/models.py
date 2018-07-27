# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models

# Create your models here.
from django_project.models import TimestampModel
from django.contrib.auth import get_user_model
from django_enumfield import enum
from redshift.models import RedShiftDb
from django_celery_beat.models import PeriodicTask

User = get_user_model()


class LoaderStatus(enum.Enum):
    IN_PROGRESS = 0
    DONE = 1
    FAILED = 2
    STOPPED = 3
# Create your models here.


class LoaderSetting(TimestampModel):
    name = models.CharField(max_length=200)
    redshift = models.ForeignKey(RedShiftDb, null=True, blank=True)
    schema = models.CharField(max_length=200, default='redshift_etl')
    table_name = models.CharField(max_length=200, null=True, blank=True)
    is_header = models.BooleanField(default=True)
    delimiter = models.CharField(max_length=200, default=',')
    encoding = models.CharField(max_length=200,default='utf-8')
    strategy = models.CharField(max_length=200,null=True, default='Replace')
    sample_size = models.IntegerField(default=500)
    skip_errors = models.IntegerField(default=500)


class Loader(TimestampModel):
    user = models.ForeignKey(User)
    s3_url = models.CharField(max_length=400, null=True, blank=True)
    s3_key = models.CharField(max_length=500)
    s3_file_name = models.CharField(max_length=400, null=True, blank=True)
    s3_folder_key = models.CharField(max_length=200, null=True, blank=True)
    file_number = models.IntegerField(default=0, null=False, blank=False)
    bucket_name = models.CharField(max_length=200)
    bundle_id = models.CharField(max_length=200)

    status = models.IntegerField(null=False, blank=False,default=0)
    status_detail = models.TextField(max_length=200, null=True, blank=True, default="Ready")
    settings = models.ForeignKey(LoaderSetting, null=True,blank=True)
    schedule = models.ForeignKey(PeriodicTask, null=True, blank=True)
    loader_type = models.CharField(max_length=200, null=True, blank=True, default="file")


class TransformFilter(TimestampModel):
    bundle_id = models.CharField(max_length=200)
    meta_data = models.TextField(null=True, blank=True)


class LoaderError(TimestampModel):
    loader_id = models.IntegerField(null=False, blank=False)
    bundle_id = models.CharField(max_length=200, null=True, blank=True)
    error_type = models.CharField(max_length=100, null=True, blank=True)
    reason = models.CharField(max_length=200, null=True, blank=True)
    raw_record = models.CharField(max_length=1000, null=True, blank=True)


class LoaderList(models.Model):
    name = models.CharField(max_length=200, null=True, blank=True)
    modified_date = models.DateTimeField(auto_now=True)
    schema = models.CharField(max_length=200, null=True, blank=True)
    table_name = models.CharField(max_length=200, null=True, blank=True)
    status_detail = models.TextField(max_length=200, null=True, blank=True)
    bundle_id = models.CharField(max_length=200, null=True, blank=True)