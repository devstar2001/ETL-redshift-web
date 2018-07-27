from django.conf.urls import url
from . import api
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    url(r'^(?i)api/Login/', api.UserLogin.as_view()),
    url(r'^(?i)api/SignUp/', api.UserSignUp.as_view()),
    url(r'^(?i)api/Logout/', api.UserLogout.as_view()),
    url(r'^(?i)api/Activate/', api.UserActivate.as_view()),
    url(r'^(?i)api/SendMailForPassword/', api.SendMailForResetPassword.as_view()),
    url(r'^(?i)api/ChangePassword/', api.ChangePassword.as_view()),

]
# urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

