from django.conf.urls import url
from . import api


urlpatterns = [
    # url(r'^(?i)api/MultipleFileToRedShift/', api.MultipleFileToRedShift.as_view()),

    # url(r'^(?i)api/MultipleFileToRedShiftValidate/', api.MultipleFileToRedShiftValidate.as_view()),

    url(r'^(?i)api/LoaderList/', api.BundleList.as_view()),

    url(r'^(?i)api/TransformFilters/', api.TransformFilters.as_view()),

    url(r'^(?i)api/TransformHeaderData/', api.TransformedHeaderData.as_view()),

    url(r'^(?i)api/LoaderCreating/', api.LoaderCreating.as_view()),

    # url(r'^(?i)api/Loader/', api.CreateLoader.as_view()),

    url(r'^(?i)api/GetCSVRaw/', api.GetCSVRaw.as_view()),

    url(r'^(?i)api/LoaderSettings/', api.LoaderSettingControl.as_view()),

    url(r'^(?i)api/BundleTransform/', api.BundleTransform.as_view()),

    # url(r'^(?i)api/FolderBundleTransform/', api.FolderBundleTransform.as_view()),

    url(r'^(?i)api/delete/', api.DeleteLoader.as_view()),

    url(r'^(?i)api/StopLoader/', api.StopLoader.as_view()),

    url(r'^(?i)api/CopyLoader/', api.CopyLoader.as_view()),

    url(r'^(?i)api/loaderSchedule/', api.LoaderSchedule.as_view()),

]