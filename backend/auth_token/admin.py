# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import AuthToken
# Register your models here.


class AuthTokenAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in AuthToken._meta.fields]


admin.site.register(AuthToken, AuthTokenAdmin)
