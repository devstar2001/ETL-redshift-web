# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from .models import Loader, TransformFilter
# Register your models here.


class LoaderAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in Loader._meta.fields]


admin.site.register(Loader, LoaderAdmin)
admin.site.register(TransformFilter)
