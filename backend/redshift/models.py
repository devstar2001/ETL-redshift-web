# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import uuid
from django.utils import timezone
from datetime import timedelta

from django.db import models

# Create your models here.
from django.conf import settings
from django_project.models import TimestampModel
from django.contrib.auth import get_user_model
User = get_user_model()


# Create your models here.
class RedShiftDb(TimestampModel):
    user = models.ForeignKey(User)
    target_name = models.CharField(max_length=200,null=True,blank = True)
    name = models.CharField(max_length=200)
    host = models.CharField(max_length=200)
    port = models.CharField(max_length=200)
    username = models.CharField(max_length=200)
    password = models.CharField(max_length=200)


class UserEmail(TimestampModel):
    email = models.CharField(max_length=200, unique=True)