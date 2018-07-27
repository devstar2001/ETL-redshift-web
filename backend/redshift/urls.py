from django.conf.urls import url
from . import api


urlpatterns = [
	url(r'^api/redshiftdb/(?P<pk>\d+)/$', api.RedShiftDbUpdate.as_view()),
    url(r'^api/RedshiftSchema/', api.RedShiftSchemaList.as_view()),
    url(r'^(?i)api/redshiftdb/', api.RedShiftDbList.as_view()),
    # url(r'^(?i)api/CopyDataToRedShift/', api.CopyDataToRedShift.as_view()),
    url(r'^(?i)api/UserEmailList/', api.UserEmailList.as_view()),
    url(r'^(?i)api/RedShiftDbTest/', api.RedShiftDbTest.as_view()),
    url(r'^(?i)api/tables/', api.RedshiftTables.as_view()),
    url(r'^(?i)api/sqltocsv/', api.RedSqltocsv.as_view()),
    url(r'^(?i)api/sqlpreviewresult/', api.PreviewRedSQL.as_view()),
    
]
