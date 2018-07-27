from rest_framework import generics, status
from boto3.s3.transfer import S3Transfer
import boto3
import PyPDF2
import tabula
import base64
import pandas as pd
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import permissions
import tinys3
from django.conf import settings
import os
from .tasks import convert_pdftask, try_parse_url
import csv
from celery.result import AsyncResult
import json
from loader.tasks import make_local_folder, downFileFromS3
import requests


User = get_user_model()


class FileUploadView(generics.GenericAPIView):
    # parser_classes = (FileUploadParser,)
    # serializer_class = UploadFileForm
    # permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, filename='deafult_file', format=None):
        from datetime import datetime
        timestamp = str(datetime.now().strftime('%Y_%m_%d_%H_%M_%S'))
        file_obj = request.FILES['file']
        bucket_name = request.POST.get("bucket","")
        source_path = request.POST.get("source_path","/")
        r_user = request.user
        if r_user.is_superuser:
            source_path = source_path[1:]
        else:
            source_path = r_user.username + source_path
        if bucket_name == "":
            bucket_name = settings.BUCKET_NAME
                                                        # fs = FileSystemStorage(location='uploaded_csv/')
                                                        # file_obj.content_type = ''
                                                        # fs_filename = fs.save(file_obj.name, file_obj)
                                                        # uploaded_file_url = fs.url(fs_filename)

        # form = UploadFileForm(request.POST, request.FILES)
        # if form.is_valid():
        #     handle_uploaded_file(request.FILES['file'], filename, request.user.username, timestamp)

        # ext = filename[-4:]
        # filename = filename[:-4] + '__' + timestamp + ext
        s3_file_path = source_path + filename

        conn = tinys3.Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)
        # Uploading a single file
        try:
            conn.upload(s3_file_path, file_obj, bucket_name)
            # conn.update_metadata(s3_file_path, {'x-amz-meta-redshift-status': 'False'}, bucket_name)
        except requests.HTTPError as httpe:
            # if httpe.response.status_code == 404:
            return Response({'error': str(httpe)}, status=status.HTTP_303_SEE_OTHER)

        return Response({'deatils': 'Uploaded Successfully'}, status=status.HTTP_200_OK)

from django.utils import timezone
import collections
from botocore.client import ClientError


class MakeNewBucket(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request, *args, **kw):
        r_user = request.user
        if not r_user.is_superuser:
            return Response({"state": "no admin"})
        new_bucket_name = request.data.get("new_bucket_name","")
        s3 = boto3.client('s3')
        botoConn = boto3.client(
            service_name='s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)

        try:
            botoConn.head_bucket(Bucket=new_bucket_name)
        except ClientError:
            try:
                s3.create_bucket(Bucket=new_bucket_name)
            except ClientError as exec:
                return Response({"error":str(exec)})

            buckets = botoConn.list_buckets()['Buckets']
            # buckets = [d['Name'] for d in botoConn['Buckets'] if 'Name' in d]

            return Response({"state": "created", 'buckets': buckets, 'bucket_name': new_bucket_name},
                            status=status.HTTP_200_OK)



        return Response({"state": "exist", "bucket_name":new_bucket_name})


class RemoveOneBucket(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        r_user = request.user
        if not r_user.is_superuser:
            return Response({"state": "no admin"})
        del_bucket_name = request.data.get("del_bucket_name", "")
        s3_client = boto3.client('s3')
        # botoConn = boto3.client(
        #     service_name='s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        #     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)

        try:
            s3_client.head_bucket(Bucket=del_bucket_name)
        except ClientError as exec:
            error_code = int(exec.response['Error']['Code'])
            if error_code == 404:
                exists = False
            return Response({"state":"no exist"})
        try:
            bucket = boto3.resource("s3").Bucket(del_bucket_name)
            bucket.delete()
        except ClientError as exec:
            return Response({"error":str(exec)})

        buckets = s3_client.list_buckets()['Buckets']
        # buckets = [d['Name'] for d in botoConn['Buckets'] if 'Name' in d]

        return Response({"state": "deleted", 'buckets': buckets, 'bucket_name': del_bucket_name},
                        status=status.HTTP_200_OK)

class CreateOneFolder(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        source_path = request.data.get("source_path", '/')
        new_folder_name = request.data.get("new_folder_name","")
        bucket_name = request.data.get("bucket_name","")

        r_user = request.user
        if not r_user.is_superuser:
            source_path = r_user.username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]

        s3_client = boto3.client('s3')
        object_key = source_path + new_folder_name+"/"
        try:
            response = s3_client.put_object(Bucket=bucket_name, Key=object_key)
            print(response)
        except Exception as e:
            return Response({"state": "failed"}, status=status.HTTP_200_OK)
        return Response({"state": "made"}, status=status.HTTP_200_OK)


class RemoveFileOrFolder(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        source_path = request.data.get("source_path", '/')
        del_file_or_folder_name = request.data.get("del_file_or_folder_name", "")
        bucket_name = request.data.get("bucket_name", "")
        r_user = request.user
        if not r_user.is_superuser:
            source_path = r_user.username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]
        s3_resource = boto3.resource("s3")
        bucket = s3_resource.Bucket(bucket_name)
        file_key = source_path+del_file_or_folder_name
        count = 0
        for file_Obj in list(bucket.objects.filter(Prefix=file_key)):
            file_Obj.delete()
            count = count + 1
        if del_file_or_folder_name[-1] == "/":
            del_type = "folder"
        else:
            del_type = "file"
        if count > 1:
            state_info = str(1) +" folder and " + str(count-1) + " files deleted."
        else:
            state_info = "1 " + del_type + " deleted."
        return Response({"state": state_info})


class RenameFileOrFolder(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        source_path = request.data.get("source_path", '/')
        old_file_or_folder_name = request.data.get("old_file_or_folder_name", "")
        new_file_or_folder_name = request.data.get("new_file_or_folder_name", "")
        bucket_name = request.data.get("bucket_name", "")
        r_user = request.user
        if not r_user.is_superuser:
            source_path = r_user.username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]
        old_key = source_path + old_file_or_folder_name
        new_key = source_path + new_file_or_folder_name
        s3_resource = boto3.resource("s3")
        bucket = s3_resource.Bucket(bucket_name)
        count=0
        if new_file_or_folder_name[-1] == "/":
            for s3_file in list(bucket.objects.filter(Prefix=old_key)):
                suffix_key = s3_file.key.split(old_key)[1]
                real_key = new_key + suffix_key
                s3_resource.Object(bucket_name, real_key).copy_from(CopySource=bucket_name+"/"+s3_file.key)
                s3_file.delete()
                count = count + 1
        else:
            s3_resource.Object(bucket_name, new_key).copy_from(CopySource=bucket_name+"/"+old_key)
            s3_resource.Object(bucket_name, old_key).delete()

        if old_file_or_folder_name[-1] == "/":
            rename_type = "folder"
        else:
            rename_type = "file"
        if count > 1:
            state_info = str(1) +" folder( " + str(count) + " files) renamed."
        else:
            state_info = str(1) +" " + rename_type + " renamed."
        return Response({"state": state_info})


class PasteFiles(generics.GenericAPIView):
    def post(self, request, filename='deafult_file', format=None):
        copied_bucket_name = request.data.get("copied_bucket") or ''
        copied_source_path = request.data.get("copied_source_path")
        copied_file_name = request.data.get("copied_file_name")
        bucket_name = request.data.get("bucket_name") or ''
        source_path = request.data.get("source_path")

        r_user = request.user
        if copied_bucket_name == '':
            copied_bucket_name = settings.BUCKET_NAME
        if bucket_name == '':
            bucket_name = settings.BUCKET_NAME
        if r_user.is_superuser:
            copied_source_path = copied_source_path[1:]
            source_path = source_path[1:]
        else:
            copied_source_path = r_user.username + copied_source_path
            source_path = r_user.username + source_path
        copied_s3_key = copied_source_path + copied_file_name
        paste_s3_key = source_path + copied_file_name
        if copied_s3_key == paste_s3_key :
            paste_s3_key = source_path + "copied_" + copied_file_name
        s3_resource = boto3.resource("s3")

        s3_resource.Object(bucket_name, paste_s3_key).copy_from(CopySource=copied_bucket_name + "/" + copied_s3_key)
        return Response({'state': 'pasted'})


class MoveFiles(generics.GenericAPIView):
    def post(self, request, filename='deafult_file', format=None):
        copied_bucket_name = request.data.get("copied_bucket") or ''
        copied_source_path = request.data.get("copied_source_path")
        copied_file_name = request.data.get("copied_file_name")
        bucket_name = request.data.get("bucket_name") or ''
        source_path = request.data.get("source_path")

        r_user = request.user
        if copied_bucket_name == '':
            copied_bucket_name = settings.BUCKET_NAME
        if bucket_name == '':
            bucket_name = settings.BUCKET_NAME
        if r_user.is_superuser:
            copied_source_path = copied_source_path[1:]
            source_path = source_path[1:]
        else:
            copied_source_path = r_user.username + copied_source_path
            source_path = r_user.username + source_path
        copied_s3_key = copied_source_path + copied_file_name
        paste_s3_key = source_path + copied_file_name
        if copied_s3_key == paste_s3_key:
            paste_s3_key = source_path + "moved_" + copied_file_name
        s3_resource = boto3.resource("s3")

        s3_resource.Object(bucket_name, paste_s3_key).copy_from(CopySource=copied_bucket_name + "/" + copied_s3_key)
        s3_resource.Object(copied_bucket_name, copied_s3_key).delete()

        return Response({'state': 'moved'})


class DownloadFileOrFolder(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        source_path = request.data.get("source_path", '/')
        file_or_folder_name = request.data.get("file_or_folder_name", "")
        bucket_name = request.data.get("bucket_name", "")
        r_user = request.user
        if not r_user.is_superuser:
            source_path = r_user.username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]
        s3 = boto3.resource('s3')

        s3_file_path = source_path + file_or_folder_name
        local_file_path = "media/" + file_or_folder_name

        try:
            # s3.Bucket(bucket_name).download_file(s3_file_path, local_file_path)
            bucket = s3.Bucket(bucket_name)
            obj = bucket.Object(source_path + file_or_folder_name)
            body = base64.b64encode(obj.get()['Body'].read())
            # with open( local_file_path, 'wb') as s_data:
            #     obj.download_fileobj(s_data)
        except ClientError as e:
            return Response({'state': str(e)}, status=status.HTTP_404_NOT_FOUND)


        return Response({"state":"downloaded",'down_file_name':file_or_folder_name, 'body':body})


from loader.models import Loader, TransformFilter, LoaderSetting


class UserFilesList(generics.ListAPIView):
    def post(self, request, *args, **kw):
        r_user = request.user

        source_path = request.data.get("source_path", '/')
        r_bucket_name = request.data.get("bucket_name", '')
        mode = request.data.get("mode","")
        filter_string = request.data.get("filter","")

        if not r_user.is_superuser:
            bucket_name = settings.BUCKET_NAME
            if source_path == '':
                source_path='/'
            source_path = request.user.username + source_path
        else:
            if not r_bucket_name == "":
                bucket_name = r_bucket_name
            else:
                bucket_name = settings.BUCKET_NAME
            if source_path.startswith("/"):
                source_path = source_path[1:]

              #specific sources
        bundle_id = request.data.get("bundle_id", '')
        if not bundle_id =='':
            loader = Loader.objects.get(bundle_id=bundle_id)
            file_name = loader.s3_file_name
            bucket_name = loader.bucket_name
            s3_key = loader.s3_key
            source_path = s3_key.split(file_name)[0]

        s3_resource = boto3.resource("s3")
        bucket = s3_resource.Bucket(bucket_name)

        objs = list(bucket.objects.filter(Prefix=source_path))
        if len(objs) == 0 and source_path[:-1] == r_user.username:
            s3_client = boto3.client('s3')
            object_key = source_path
            try:
                response = s3_client.put_object(Bucket=bucket_name, Key=object_key)
                print(response)
            except Exception as e:
                return Response({"state": "Creating user root folder failed"}, status=status.HTTP_200_OK)

        list_files = []
        for s3_file in objs:
            if source_path == '':
                sub_path = s3_file.key
            else:
                sub_path = s3_file.key.split(source_path)[1]  # entire path - source_path
            if mode == "flat":
                sub_path = s3_file.key
                sub_real_path = sub_path
                if not r_user.is_superuser:
                    sub_path = s3_file.key.split(r_user.username)[1]
                    sub_real_path = sub_path
            else:
                if len(sub_path.split('/')) > 1:
                    sub_real_path = sub_path.split('/')[0] + "/"
                else:
                    sub_real_path = sub_path.split('/')[0]

            if str.upper(filter_string) in str.upper(sub_real_path) and not sub_real_path == '':
                # if sub_real_path.endswith('.csv') or sub_real_path.endswith('.txt') or sub_real_path.endswith('.pdf') or sub_real_path.endswith("/") :

                    file_type = ''
                    if sub_real_path.endswith('.csv'):
                        file_type = 'CSV Document'
                    if sub_real_path.endswith('.pdf'):
                        file_type = 'PDF Document'
                    if sub_real_path.endswith('.txt'):
                        file_type = 'TXT Document'
                    created = ""
                    size = 0
                    storage_class = ''
                    if not sub_real_path.endswith("/"):
                        created = s3_file.last_modified
                        size = s3_file.size
                        storage_class = s3_file.storage_class

                    file = {'filename': sub_real_path, 'created': created, 'size':size,
                            'file_type':file_type,'storage_class':storage_class}
                    for temp in list_files:
                        if temp['filename'] == file['filename']:
                            list_files.remove(file)
                    list_files.append(file)

        if r_user.is_superuser:
            List_BucketObject = boto3.client(
                service_name='s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID, aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY).list_buckets()
            buckets = List_BucketObject['Buckets']
            # buckets = [d['Name'] for d in botoConn['Buckets'] if 'Name' in d]

            return Response({'files': list_files, 'buckets': buckets, 'bucket_name':bucket_name},
                            status=status.HTTP_200_OK)
        return Response({'files': list_files},
                        status=status.HTTP_200_OK)
    # permission_classes = (permissions.IsAuthenticated,)

class ValidateFileExisting(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        r_user = request.user
        file_name = request.data.get('file', '')
        bucket_name = request.data.get("bucket", "")
        source_path = request.data.get("source_path", "/")

        if r_user.is_superuser:
            s3_key = source_path[1:] + file_name
            if bucket_name == '':
                bucket_name = settings.BUCKET_NAME
        else:
            s3_key = r_user.username + source_path + file_name
            bucket_name = settings.BUCKET_NAME

            make_local_folder(request.user.username, 'uploaded_files')
        local_file_path = 'uploaded_files/' + request.user.username + "/" + file_name
        if not os.path.exists(local_file_path):
            f, st = downFileFromS3(bucket_name, s3_key, local_file_path)
            if not f:
                return Response({'error': 'failed downloading from s3 to EC2. \n detail:' + st},
                                status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'state': 'downloaded'})
        return Response({'state': 'exist'})


class GetPdfPage(generics.GenericAPIView):
    def post(self, request, *args, **kw):

        file_name = request.data.get('file', '')
        page_number = int(request.data.get('page_number')) or 1

        pdfFilename = 'uploaded_files/'+request.user.username + '/'+ file_name

        try:

            pfr = PyPDF2.PdfFileReader(open(pdfFilename, "rb"))  # PdfFileReader object
        except Exception as exc:
            return Response({"error":str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        pageCount = pfr.getNumPages()
        pg1 = pfr.getPage(page_number-1)


        writer = PyPDF2.PdfFileWriter()  # create PdfFileWriter object
        writer.addPage(pg1)

        NewPDFfilename = file_name[:-4]+"_page_"+str(page_number)+".pdf"
        NewPDFfilename_path = "media/" + NewPDFfilename
        try:
            with open(NewPDFfilename_path, "wb") as outputStream:  # create new PDF
                writer.write(outputStream)  # write pages to new PDF
        except Exception:
            return Response({'file_url': '', 'all_page_counts': pageCount, 'raw_data': [], 'headers': [], 'page_number':page_number})

        if settings.SITE_DOMAIN[-4:] == '3000':
            file_url = "http://" + settings.SITE_DOMAIN[:-4]+"8000/media/"+NewPDFfilename
        else:
            file_url = "http://" + settings.SITE_DOMAIN+":8000/media/"+NewPDFfilename
        PDFfilename = "uploaded_files" + "/" + request.user.username + "/" + file_name
        try:
            df_first = tabula.read_pdf(PDFfilename, pages=page_number)
            if df_first is None:
                return Response({'file_url': file_url, 'all_page_counts': pageCount, 'raw_data': [], 'headers': [], 'page_number':page_number})
        except Exception as exc:
            return Response({'file_url': file_url, 'all_page_counts': pageCount, 'raw_data': [], 'headers': [], 'page_number':page_number})

        headers = list(df_first)
        raw_data = df_first.to_csv(sep=',', encoding='utf-8', index=False)
        cols = csv.reader(raw_data.splitlines())
        cols = list(cols)
        return Response({'file_url':file_url, 'all_page_counts':pageCount, 'raw_data':cols, 'headers':headers, 'page_number':page_number})


class TestConvertPdfToCsv(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        filename = request.data.get("filename")
        username = request.user.username
        rename_headers = request.data.get('rename_headers') or None
        split_headers= request.data.get('split_headers') or None
        page_number = int(request.data.get("page_number")) or 1
        filename_path = "uploaded_files" + "/" + username + "/" + filename
        del_row_str = request.data.get("del_row_str") or None
        df_page = pd.DataFrame()
        try:

            df_first = tabula.read_pdf(filename_path, pages=page_number)
        except Exception as exc:
            return Response({"reason": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        df_first = df_first.dropna(axis=0, how='all')
        df_first = df_first.reset_index(drop=True)
        columns_df_first = list(df_first)
        if del_row_str:
            for c in columns_df_first:
                df_first = df_first[~df_first[c].isin(del_row_str)]
        df_first = df_first.reset_index(drop=True)
        for i in range(len(columns_df_first)-1):
            df_first = df_first.rename(columns={columns_df_first[i]: rename_headers[i]})

        df_first = df_first.reset_index(drop=True)
        col_child_count = 0
        col_child_names = []
        try:
            for col in rename_headers:
                for main_col in split_headers:
                    if main_col == col:
                        col_child_count = col_child_count + 1
                        col_child_names.append(main_col)
                        break
                    if main_col + " " in col or " " + main_col in col:
                        col_child_count = col_child_count + 1
                        col_child_names.append(main_col)
                if col_child_count > 0:
                    if col_child_count == 1:
                        df_temp = pd.DataFrame(df_first[col])
                    if col_child_count > 1:
                        df_temp = pd.DataFrame(df_first[col].str.split(' ', expand=True, n=1)).rename(columns={0:col_child_names[0],
                                                                                                               1:col_child_names[1]})
                    df_page[col_child_names] = df_temp

                col_child_count = 0
                col_child_names = []
            print("----- successful! page number: " + str(page_number) + "----------")
            print("entire row counts : " + str(df_page.count(axis=0).values[0]))
        except Exception as exc:
            print("-------failed! page number: " + str(page_number) + "----------")
            print("This page discovered error following : " + str(exc))
            return Response(status=status.HTTP_400_BAD_REQUEST)
        df_result = pd.DataFrame()
        for c in split_headers:
            if c in df_page:
                df_result[c] = df_page[c]

        real_data = df_result.to_csv(sep=',', encoding='utf-8', index=False)
        cols = csv.reader(real_data.splitlines())
        cols = list(cols)
        return Response({'real_data':cols, 'page_number':page_number})


class ConvertPdfToCsv(generics.GenericAPIView):
    def post(self, request, *args, **kw):

        filename = request.data.get("filename")
        username = request.user.username
        bucket_name = request.data.get('bucket')
        source_path = request.data.get("source_path") or'/'
        if not request.user.is_superuser:
            source_path = username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]

        convert_flag = request.data.get("convert_flag")
        start_page_number = int(request.data.get("start_page")) or 1
        end_page_number = int(request.data.get("end_page")) or 10
        rename_headers = request.data.get('rename_headers') or None
        split_headers = request.data.get('split_headers') or None
        job_id = request.data.get("job")
        table_headers = request.data.get('table_headers') or ""
        del_row_str = request.data.get("del_row_str") or None
        ext = '.pdf'
        if convert_flag == 0 and job_id == '':   # check if task exist
            context = {
                'convert_flag': 0,
                'job': '',
                'state': "Nothing running task"
            }
            context = json.dumps(context)
            print(context)
            return Response(context)
        if convert_flag == 0 and not job_id == '':  # check if task exist
            state = AsyncResult(job_id).state
            if state == "PENDING":
                context = {
                    'convert_flag': 0,
                    'job': '',
                    'state': "Nothing running task"
                }
            else:
                job = AsyncResult(job_id)
                context = {
                    'convert_flag': 2,
                    'job': str(job_id),
                    'state': state,
                    'info': json.dumps(job.result or "")
                }

            context = json.dumps(context)
            print(context)
            return Response(context)

        if job_id == '' and convert_flag == 3 and rename_headers:
            job = convert_pdftask.delay(bucket_name, source_path, filename, username, start_page_number, end_page_number,del_row_str, rename_headers, split_headers)
            context = {
                'convert_flag': 3,
                'job': str(job),
                'state': 'STARTED'
            }
            context = json.dumps(context)
            print(context)
            return Response(context)
        if not job_id == '' and convert_flag == 4:
            job = AsyncResult(job_id)
            state = job.state
            if state == 'COMPLETED':
                context = {
                    'convert_flag': 0,
                    'job': str(job_id),
                    'state': state,
                    'info': json.dumps(job.result or "")
                }
                context = json.dumps(context)
                print(context)
                return Response(context)
            context = {
                'convert_flag': 4,
                'job': str(job_id),
                'state': state,
                'info': json.dumps(job.result or "")
            }
            context = json.dumps(context)
            print(context)
            return Response(context)

        if convert_flag == 5:
            # app.control.revoke(job_id, terminate=True, signal='SIGKILL')
            # celery.control.revoke(job_id, terminate=True, signal='SIGKILL')
            abortable_task = AsyncResult(job_id).revoke(terminate=True, signal='SIGKILL')
            # abortable_task.abort()
            context = {
                'convert_flag': 0,
                'job': str(job_id),
                'state': "manual stopped!",
                'info': ''
            }
            context = json.dumps(context)
            print(context)
            return Response(context)
        else:
            context = {
                'convert_flag': 5,
                'job': '',
                'state': "None Request type ",
                'info': ''
            }
            context = json.dumps(context)
            print(context)
            return Response(context)


class ScrapTable(generics.GenericAPIView):
    def post(self, request, *args, **kw):

        url = request.data.get("site_url")
        if url is None:
            return Response({'filename': []}, status=status.HTTP_200_OK)

        if "http://" in url:
            csv_filename_prefix = url.split("http://")[1]

        if "https://" in url:
            csv_filename_prefix = url.split("https://")[1]

        csv_filename_prefix = csv_filename_prefix.split("/")[0]

        df_data_items = try_parse_url(url)  # Grabbing the table from the tuple
        index = 0
        filenames = []
        # directory_path = "media/"

        for df_data_item in df_data_items:

            df_table = df_data_item[0]
            is_header = df_data_item[1]
            if not df_table.empty:
                index = index + 1
                csv_filename = csv_filename_prefix + "_" + str(index) + ".csv"
                if is_header:
                    df_table.to_csv("media/" + csv_filename, index=False)
                    filenames.append({"name":csv_filename, "selected":False})
                else:
                    df_table.to_csv("media/" + csv_filename, index=False, header=False)
                    filenames.append({"name": csv_filename, "selected":False})
        return Response({'filenames': filenames}, status=status.HTTP_200_OK)


class GetTableData(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        file_name = request.data.get("file_name")
        csv_line_spliter = '\n'
        encoding = "utf-8"
        local_file_path = 'media/' + file_name
        if not os.path.exists(local_file_path):
            return Response({"raw_data": '', "file_name": file_name})

        raw_lines = ''
        init_line_size = 0
        with open(local_file_path, encoding=encoding, newline=csv_line_spliter) as rawfile:
            for line in rawfile.readlines():
                raw_lines = raw_lines + line
        return Response({"raw_data": raw_lines, "file_name": file_name})


class UploadWebfiles(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        username = request.user.username
        bucket_name = request.data.get('bucket')
        source_path = request.data.get("source_path") or '/'
        site_url = request.data.get("site_url")
        table_numbers = request.data.get("table_numbers") or [1]
        if not request.user.is_superuser:
            source_path = username + source_path
            bucket_name = settings.BUCKET_NAME
        else:
            source_path = source_path[1:]
        client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        transfer = S3Transfer(client)
        if "http://" in site_url:
            csv_filename_prefix = site_url.split("http://")[1]

        if "https://" in site_url:
            csv_filename_prefix = site_url.split("https://")[1]

        csv_filename_prefix = csv_filename_prefix.split("/")[0]
        for tn in table_numbers:
            csv_filename = csv_filename_prefix + "_"+str(tn)+".csv"
            s3_file_path = source_path + csv_filename
            local_file_path = "media/" + csv_filename
            transfer.upload_file(local_file_path, bucket_name, s3_file_path)

        return Response({"status": "success"})


from .models import Scraper
from django_celery_beat.models import PeriodicTask, PeriodicTasks, IntervalSchedule, CrontabSchedule, SolarSchedule
import pytz
from django.utils.dateparse import parse_datetime
import datetime

class SaveScraper(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        username = request.user.username
        bucket_name = request.data.get('bucket')
        site_url = request.data.get('site_url')
        table_indexs = request.data.get('table_indexs')
        source_path = request.data.get("source_path") or '/'
        scraper_id = request.data.get("scraper_id") or None
        scraper_name = request.data.get("scraper_name") or None


        schedule_frequency = request.data.get('schedule_frequency')
        hours_of_day = request.data.get('hours_of_day')
        if len(hours_of_day) == 0:
            str_hours_of_day = "*"
        else:
            str_hours_of_day = json.dumps(hours_of_day).strip("[").strip("]").replace('"', '').replace(" ", '')
        days_of_week = request.data.get('days_of_week')
        if len(days_of_week) == 0:
            str_days_of_week = "*"
        else:
            str_days_of_week = json.dumps(days_of_week).strip("[").strip("]").replace('"', '').replace(" ", '')
        # weeks_of_month = request.data.get('weeks_of_month')
        days_of_month = request.data.get('days_of_month')
        if days_of_month is None:
            str_days_of_month = "0"
        else:
            str_days_of_month = str(days_of_month)
        months_of_year = request.data.get('months_of_year')
        if len(months_of_year) == 0:
            str_months_of_year = "*"
        else:
            str_months_of_year = json.dumps(months_of_year).strip("[").strip("]").replace('"', '').replace(" ", '')

        frequency = request.data.get('frequency')
        cur_utc = request.data.get('cur_utc') or "0000-00-00 00:00"
        select_month = cur_utc[5:7]
        if select_month[0] == "0":
            select_month = select_month[1]
        select_date = cur_utc[8:10]
        if select_date[0] == "0":
            select_date = select_date[1]
        select_hour = cur_utc[11:13]
        if select_hour[0] == "0":
            select_hour = select_hour[1]
        select_minute = cur_utc[14:16]
        if select_minute[0] == "0":
            select_minute = select_minute[1]
        sel_datetime = parse_datetime(cur_utc)
        sel_datetime = pytz.timezone("UTC").localize(sel_datetime, is_dst=None)

        strdate = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M")
        task_name = schedule_frequency + "__scraper_" + strdate

        if not request.user.is_superuser:
            source_path = username + source_path
            bucket_name = settings.BUCKET_NAME
        if bucket_name is None:
            bucket_name = settings.BUCKET_NAME


        try:
            scraper = Scraper.objects.get(id=scraper_id)
        except Scraper.DoesNotExist:
            scraper = Scraper.objects.create(name=scraper_name,
                                             site=site_url,
                                             upload_path=source_path,
                                             bucket_name=bucket_name,
                                             table_numbers=json.dumps(table_indexs),
                                             user=request.user)
        param_args = [scraper.id, site_url, source_path, bucket_name, json.dumps(table_indexs)]

        pt = scraper.schedule

        if schedule_frequency=='None':
            if pt:
                scraper.schedule=None
                scraper.save()
                cs = pt.crontab
                cs.delete()
                pt.delete()
                pt = None
                cs = None

        if schedule_frequency=='Once':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week="*"
                cs.day_of_month=select_date
                cs.month_of_year=select_month
                cs.save()
                pt.enabled = 1
                pt.name = task_name
                pt.last_run_at=timezone.now()
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week="*",
                                               day_of_month=select_date,
                                               month_of_year=select_month)

                pt =PeriodicTask.objects.create(name=task_name,
                                             task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=timezone.now()
                                             )

        if schedule_frequency=='Minutely':

            if pt:
                cs = pt.crontab
                cs.minute="*/"+ str(frequency)
                cs.hour=str_hours_of_day
                cs.day_of_week="*"
                cs.day_of_month="*"
                cs.month_of_year="*"
                cs.save()
                pt.enabled = 1
                pt.last_run_at=sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute="*/"+str(frequency),
                                               hour=str_hours_of_day,
                                               day_of_week="*",
                                               day_of_month="*",
                                               month_of_year="*")

                pt =PeriodicTask.objects.create(name=task_name,
                                            task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )

        if schedule_frequency=='Hourly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour="*/"+ str(frequency)
                cs.day_of_week = str_days_of_week
                cs.day_of_month="*"
                cs.month_of_year="*"
                cs.save()
                pt.enabled = 1
                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour="*/"+str(frequency),
                                               day_of_week=str_days_of_week,
                                               day_of_month="*",
                                               month_of_year="*")

                pt =PeriodicTask.objects.create(name=task_name,
                                            task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency=='Daily':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = "*"
                cs.day_of_month="*/"+ str(frequency)
                cs.month_of_year="*"
                cs.save()
                pt.enabled = 1
                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week="*",
                                               day_of_month="*/"+str(frequency),
                                               month_of_year="*")

                pt =PeriodicTask.objects.create(name=task_name,
                                            task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency=='Weekly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = str_days_of_week
                cs.day_of_month="*"
                cs.month_of_year="*"
                cs.save()
                pt.enabled = 1
                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week=str_days_of_week,
                                               day_of_month="*",
                                               month_of_year="*")

                pt =PeriodicTask.objects.create(name=task_name,
                                            task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency=='Monthly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = str_days_of_week
                cs.day_of_month = str_days_of_month
                cs.month_of_year="*/"+str(frequency)
                cs.save()
                pt.enabled = 1
                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week=str_days_of_week,
                                               day_of_month=str_days_of_month,
                                               month_of_year="*/"+str(frequency))

                pt =PeriodicTask.objects.create(name=task_name,
                                            task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency=='Yearly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = str_days_of_week
                cs.day_of_month = str_days_of_month
                cs.month_of_year=str_months_of_year
                cs.save()
                pt.enabled = 1
                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week=str_days_of_week,
                                               day_of_month=str_days_of_month,
                                               month_of_year=str_months_of_year)

                pt = PeriodicTask.objects.create(name=task_name,
                                           task='uploader.tasks.parse_upload_task',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )

        scraper.schedule = pt
        scraper.name = scraper_name
        scraper.site = site_url
        scraper.upload_path = source_path
        scraper.bucket_name = bucket_name
        scraper.table_numbers = json.dumps(table_indexs)
        scraper.user = request.user
        scraper.save()

        PeriodicTasks.objects.update(last_update=timezone.now())
        if scraper:
            return Response({"status": "Success"}, status=status.HTTP_200_OK)
        else:
            return Response({"details": "failed"}, status=status.HTTP_400_BAD_REQUEST)


from .serializers import ScraperSerializer
class GetScraperList(generics.GenericAPIView):
    serializer_class = ScraperSerializer
    def get(self, request):
        scrapers = Scraper.objects.filter(user=request.user)
        serial_data = ScraperSerializer(scrapers,  many=True)
        print(serial_data.data)
        return Response({"scrapers": serial_data.data}, status=status.HTTP_200_OK)


class GetScheduleByID(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        schedule_id = request.data.get('schedule_id')
        try:
            pt = PeriodicTask.objects.get(id=schedule_id)
        except PeriodicTask.DoesNotExist:
            pt = None
            schedule_frequency = 'None'
        ct = None
        if pt:
            try:
                ct = pt.crontab
            except CrontabSchedule.DoesNotExist:
                ct = None

        if ct:
            schedule_frequency = pt.name.split("__")[0]
            start_utc_time = pt.last_run_at
            ct_minute = ct.minute
            ct_hour = ct.hour
            ct_day_of_week = ct.day_of_week
            ct_day_of_month = ct.day_of_month
            ct_month_of_year = ct.month_of_year

        s3 = boto3.resource('s3')

        send_data ={}

        send_data['schedule_frequency'] = schedule_frequency
        send_data['start_utc_time'] = start_utc_time
        send_data['ct_minute'] = ct_minute
        send_data['ct_hour'] = ct_hour
        send_data['ct_day_of_week'] = ct_day_of_week
        send_data['ct_day_of_month'] = ct_day_of_month
        send_data['ct_month_of_year'] = ct_month_of_year
        return Response(send_data, status=status.HTTP_200_OK)


class RemoveScraperByID(generics.GenericAPIView):
    def post(self, request, *args, **kw):
        id = request.data.get("id")
        try:
            scraper = Scraper.objects.get(id=id)
        except Scraper.DoesNotExist:
            scraper = None
            return Response({"details": "No scraper exist."}, status=status.HTTP_400_BAD_REQUEST)
        pt = scraper.schedule
        if pt:
            cs = pt.crontab
            if cs:
                cs.delete()
            pt.delete()
        scraper.delete()
        return Response({"status": "Removed a scraper successfully"}, status=status.HTTP_200_OK)