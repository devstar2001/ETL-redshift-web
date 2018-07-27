# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import RedShiftDb
# Register your models here.


class RedShiftDbAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in RedShiftDb._meta.fields]


admin.site.register(RedShiftDb, RedShiftDbAdmin)
