from django.conf.urls import url
from . import api
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    # url(r'upload$', api.FileUploadView.as_view())
    url(r'^(?i)api/upload/(?P<filename>[^/]+)$', api.FileUploadView.as_view()),
    url(r'^(?i)api/list', api.UserFilesList.as_view()),
    url(r'^(?i)api/pdftocsv', api.ConvertPdfToCsv.as_view()),
    url(r'^(?i)api/getpdfpage', api.GetPdfPage.as_view()),
    url(r'^(?i)api/testpdfpage', api.TestConvertPdfToCsv.as_view()),
    url(r'^(?i)api/makebucket', api.MakeNewBucket.as_view()),
    url(r'^(?i)api/removebucket', api.RemoveOneBucket.as_view()),
    url(r'^(?i)api/makefolder', api.CreateOneFolder.as_view()),
    url(r'^(?i)api/removefileandfolder', api.RemoveFileOrFolder.as_view()),
    url(r'^(?i)api/renamefileandfolder', api.RenameFileOrFolder.as_view()),
    url(r'^(?i)api/downloadfileandfolder', api.DownloadFileOrFolder.as_view()),
    url(r'^(?i)api/validatefile', api.ValidateFileExisting.as_view()),
    url(r'^(?i)api/pastefiles', api.PasteFiles.as_view()),
    url(r'^(?i)api/movefiles', api.MoveFiles.as_view()),
    url(r'^(?i)api/extractfromweb', api.ScrapTable.as_view()),
    url(r'^(?i)api/gettabledata', api.GetTableData.as_view()),
    url(r'^(?i)api/uploadwebfiles', api.UploadWebfiles.as_view()),
    url(r'^(?i)api/savescraper', api.SaveScraper.as_view()),
    url(r'^(?i)api/scraperlist', api.GetScraperList.as_view()),
    url(r'^(?i)api/getschedulebyid', api.GetScheduleByID.as_view()),
    url(r'^(?i)api/removeScraperbyid', api.RemoveScraperByID.as_view()),



]
