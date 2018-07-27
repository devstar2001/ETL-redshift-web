
from .tasks import *
from redshift.api import check_table_exist, get_last_number_id
from .serializers import LoaderListSerializer, TransformFilterSerializer, LoaderSettingsSerializer
from .models import Loader, TransformFilter, LoaderSetting, LoaderList
from rest_framework.renderers import JSONRenderer
User = get_user_model()

try:
    import urllib.parse as urllib
except:
    import urllib

from django.conf import settings


class BundleList(generics.GenericAPIView):
    def get(self, request):
        sql = 'SELECT ls.id , ls.name,  ls.schema, ls.table_name,  L.status_detail, ls.modified_date, L.bundle_id FROM loader_loadersetting ls LEFT JOIN loader_loader L ON L.settings_id = ls.id WHERE L.user_id = ' + str(request.user.id) + ' GROUP BY ls.id  ORDER BY L.modified_date DESC'
        data = LoaderList.objects.raw(sql)
        serializer = LoaderListSerializer(data, many=True)
        js = JSONRenderer().render(serializer.data)
        return Response(serializer.data)


class LoaderCreating(generics.ListCreateAPIView):

    def post(self, request, *args, **kwargs):

        r_user = request.user
        file_name = request.data.get('file', '')
        bucket_name = request.data.get("bucket", "")
        source_path = request.data.get("source_path", "/")
        s3_folder_key = ''
        if r_user.is_superuser:
            s3_key = source_path[1:] + file_name
            if bucket_name == '':
                bucket_name = settings.BUCKET_NAME
        else:
            s3_key = r_user.username + source_path + file_name
            bucket_name = settings.BUCKET_NAME
        if file_name[-1] != '/':
            loader_type = 'file'
            # local_file_path = 'uploaded_files/' + r_user.username + "/" + file_name
        else:
            loader_type = 'folder'
            s3_folder_key = s3_key
        make_local_folder(r_user.username, 'uploaded_files')
        # if not os.path.exists(local_file_path):
        #     f, st = downFileFromS3(bucket_name, s3_key, local_file_path)
        #     if not f:
        #         return Response({'error': 'failed downloading from s3 to EC2. \n detail:' + st},
        #                         status=status.HTTP_400_BAD_REQUEST)
        bundle_id = str(datetime.now().strftime('%Y_%m_%d_%H_%M_%S'))
        s3_url = "http://" + bucket_name + ".s3.amazon.com/"+ s3_key
        create_loaders(request.user.id, s3_url, s3_key, bundle_id, file_name, s3_folder_key, 0, bucket_name, loader_type)
        return Response({'bundle_id': bundle_id, 'state':'Loading File success'}, status=status.HTTP_200_OK)


class GetCSVRaw(generics.GenericAPIView):

    def post(self, request, *args, **kwargs):
        bundle_id = request.data.get("bundle_id")
        file_name = request.data.get("file")

        loader = Loader.objects.get(bundle_id=bundle_id)
        r_user = request.user
        # file_name = loader.s3_file_name
        bucket_name = loader.bucket_name

        s3_key = loader.s3_key
        print("filename: ", file_name, "s3_key:", s3_key)
        po1 = s3_key[::-1].index("/")
        s3_key = s3_key[:len(s3_key)-po1] + file_name
        print("filename: ", file_name, "s3_key:", s3_key)
        sample_size = int(request.data.get('sample_size', '0'))
        csv_line_spliter = '\n'

        encoding = "utf-8"
        make_local_folder(r_user.username, 'uploaded_files')
        local_file_path = 'uploaded_files/' + r_user.username + "/" + file_name
        if not os.path.exists(local_file_path):
            f, st = downFileFromS3(bucket_name, s3_key, local_file_path)
            if not f:
                return Response({'error': 'failed downloading from s3 to EC2. \n detail:' + st},
                            status=status.HTTP_400_BAD_REQUEST)

        raw_lines = ''
        init_line_size = 0
        with open(local_file_path, encoding=encoding, newline=csv_line_spliter) as rawfile:
            while True:
                init_line_size = init_line_size + 1
                if init_line_size > sample_size:
                    break
                raw_lines = raw_lines + rawfile.readline()

        return Response({'raw_data':raw_lines})


class LoaderSettingControl(generics.GenericAPIView):
    serializer_class = LoaderSettingsSerializer

    def get(self, request):
        bundle_id = request.query_params.get("bundle_id")
        r_user = request.user
        loader = Loader.objects.filter(bundle_id=bundle_id).first()
        s3_key = loader.s3_key
        file_name = loader.s3_file_name
        schedule_frequency = None
        start_utc_time = None
        ct_minute = None
        ct_hour = None
        ct_day_of_week = None
        ct_day_of_month = None
        ct_month_of_year = None

        try:
            pt = loader.schedule
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
        list_key_count = 0
        if loader.loader_type == 'folder':
            s3_resource = boto3.resource("s3")
            bucket = s3_resource.Bucket(loader.bucket_name)
            objs = list(bucket.objects.filter(Prefix=loader.s3_folder_key))
            s3_key_list = []
            for s3_file in objs:
                if s3_file.key[-3:] == 'csv' or s3_file.key[-3:] == 'txt':
                    s3_key_list.append(s3_file.key)
            list_key_count = len(s3_key_list)
            file_name = s3_key_list[0].split('/')[-1]
            s3_key = s3_key_list[0]
            loader.s3_key = s3_key
            loader.s3_file_name = file_name
            loader.save()
        make_local_folder(r_user.username, 'uploaded_files')
        local_file_path = 'uploaded_files/' + r_user.username + "/" + file_name
        loader_setting = LoaderSetting.objects.filter(id=loader.settings_id).first()

        f, st = downFileFromS3(loader.bucket_name, s3_key, local_file_path)
        if not f:
            return Response({'error': 'failed downloading from s3 to EC2. \n detail:' + st},
                            status=status.HTTP_400_BAD_REQUEST)

        s3 = boto3.resource('s3')
        bucket = s3.Bucket(loader.bucket_name)
        objs = list(bucket.objects.filter(Prefix=s3_key))
        if len(objs) > 0 and objs[0].key == loader.s3_key:
            # print("Exists!")
            f = True
        else:
            # print("Doesn't exist")
            f = False

        serial_data = LoaderSettingsSerializer(loader_setting).data
        serial_data['loader_type'] = loader.loader_type
        serial_data['folder'] = ''
        if loader.loader_type in 'folder':
            serial_data['folder'] = loader.s3_folder_key

        serial_data['file'] = file_name

        serial_data['file_count'] = list_key_count
        serial_data['file_exist'] = f

        serial_data['schedule_frequency'] = schedule_frequency
        serial_data['start_utc_time'] = start_utc_time
        serial_data['ct_minute'] = ct_minute
        serial_data['ct_hour'] = ct_hour
        serial_data['ct_day_of_week'] = ct_day_of_week
        serial_data['ct_day_of_month'] = ct_day_of_month
        serial_data['ct_month_of_year'] = ct_month_of_year

        return Response(serial_data)

    def post(self, request):
        bundle_id = request.data.get("bundle_id")
        loader = Loader.objects.get(bundle_id=bundle_id)
        r_user = request.user
        file_name = self.request.data.get('file')
        if loader.loader_type == 'folder':
            file_name = loader.s3_file_name
        bucket_name = loader.bucket_name
        s3_key = loader.s3_key
        po1 = s3_key[::-1].index("/")
        s3_key = s3_key[:len(s3_key) - po1] + file_name
        local_file_path = 'uploaded_files/' + r_user.username + "/" + file_name
        f, st = downFileFromS3(bucket_name, s3_key, local_file_path)
        if not f:
            return Response({'error': 'failed downloading from s3 to EC2. \n detail:' + st},
                            status=status.HTTP_400_BAD_REQUEST)

        is_header = request.data.get("is_header")
        delimiter = request.data.get("delimiter",",")
        if delimiter == 'tab':
            print("----delimiter when save setting : " + delimiter + "------")
            # delimiter='\t'
            # print("----delimiter when save setting : " + delimiter + "------")

        encoding = request.data.get("encoding", "utf-8")
        redshift_id = self.request.data.get('redshift_id')
        table_name = self.request.data.get('table_name')
        table_name = table_name.replace('-', '_')
        strategy = self.request.data.get('strategy',"empty")
        schema = self.request.data.get('schema_name')
        skip_error_counts = self.request.data.get("skip_errors")
        name = request.data.get("name")
        sample_size = request.data.get('sample_size', 50)

        if loader.settings:

            loader.settings.is_header=is_header
            loader.settings.name=name
            loader.settings.sample_size=sample_size
            loader.settings.skip_errors=skip_error_counts
            loader.settings.encoding=encoding
            loader.settings.strategy=strategy
            loader.settings.delimiter=delimiter
            loader.settings.redshift_id=redshift_id
            loader.settings.table_name = table_name
            loader.settings.schema=schema
            loader.settings.save()
        else:
            loader_setting =LoaderSetting.objects.create(is_header=is_header,
                                                         name=name,
                                                         sample_size=sample_size,
                                                         skip_errors=skip_error_counts,
                                                         encoding=encoding,
                                                         strategy=strategy,
                                                         delimiter=delimiter,
                                                         redshift_id = redshift_id,
                                                         table_name = table_name,
                                                         schema=schema,
                                                         )
            loader.settings = loader_setting

        loader.s3_key = s3_key
        loader.s3_file_name = file_name
        loader.save()

        return Response({'bundle_id': bundle_id},
                        status=status.HTTP_200_OK)



class TransformedHeaderData(generics.GenericAPIView):
    # parser_classes = (FileUploadParser,)
    serializer_class = TransformFilterSerializer

    def get(self,request):
        bundle_id = request.query_params.get('bundle_id')
        transform_filter = TransformFilter.objects.filter(bundle_id=bundle_id).first()
        loaders = Loader.objects.filter(bundle_id=bundle_id)
        loader = loaders.first()
        loader_settings = loader.settings
        return Response({'meta_data': transform_filter.meta_data,
                             'transformfilter_id': transform_filter.id})


class TransformFilters(generics.GenericAPIView):
    # parser_classes = (FileUploadParser,)
    serializer_class = TransformFilterSerializer

    def get(self,request):
        r_user = request.user
        bundle_id = request.query_params.get('bundle_id')
        loader = Loader.objects.get(bundle_id=bundle_id)
        if not loader:
            return Response({'error': 'No loader exist'}, status=status.HTTP_400_BAD_REQUEST)

        local_file_path = 'uploaded_files/' + r_user.username + "/" + loader.s3_file_name
        transform_filter = TransformFilter.objects.filter(bundle_id=bundle_id).first()
        csv_line_spliter = '\n'
        loader_settings = loader.settings
        encoding = loader_settings.encoding
        is_header = loader_settings.is_header
        delimiter = loader_settings.delimiter
        if delimiter == 'tab':
            print("----delimiter when save setting : " + delimiter + "------")
            delimiter = "\t"
            print("----delimiter when save setting : " + delimiter + "------")
        sample_size = loader_settings.sample_size

        cols = []
        meta_data = {}
        meta_data['headers'] = []
        meta_data['line_count'] = 0

        col_counts = 0
        init_line_size = 0
        if not os.path.exists(local_file_path):
            return Response({'error': 'File No exist'}, status=status.HTTP_400_BAD_REQUEST)
        with open(local_file_path, encoding=encoding, newline=csv_line_spliter) as csvfile:
            csv_lines = csv.reader(csvfile, delimiter=delimiter, quotechar='"', skipinitialspace=True)
            line_count = len(list(csv_lines))
            if is_header:
                line_count = line_count-1
            meta_data['line_count'] = line_count

            csvfile.seek(0)
            for line in csv_lines:
                if transform_filter:
                    new_line = [str(init_line_size)]
                    for col in line:
                        new_line.append(col)

                    if is_header == 0 and init_line_size == 0:
                        cols.append(new_line)
                    if not init_line_size == 0:
                        cols.append(new_line)

                    if init_line_size > sample_size:
                        break
                else:
                    if init_line_size == 0:
                        temp_obj = {}
                        temp_obj['data_type'] = 'Long'
                        temp_obj['col_index'] = 0
                        temp_obj['orig_index'] = 0
                        temp_obj['col_name'] = 'de_id'
                        temp_obj['is_deleted'] = False
                        temp_obj['is_key'] = True
                        temp_obj['filters'] = []
                        temp_obj['max_size'] = 0
                        meta_data['headers'].append(temp_obj)
                        col_counts = len(line) + 1
                        for inner_index, col in enumerate(line):
                            temp_obj = {}
                            temp_obj['data_type'] = 'Text'
                            temp_obj['col_index'] = inner_index+1
                            temp_obj['orig_index'] = inner_index+1
                            col = col.replace(u'\ufeff', '')
                            temp_obj['col_name'] = col
                            temp_obj['is_deleted'] = False
                            temp_obj['is_key'] = False
                            temp_obj['filters'] = []
                            temp_obj['max_size'] = 0
                            meta_data['headers'].append(temp_obj)
                    else:
                        new_line = [str(init_line_size)]
                        for col in line:
                            new_line.append(col)
                        if not (len(new_line) > col_counts):
                            for inner_index, col in enumerate(new_line):
                                if len(col) > meta_data['headers'][inner_index]['max_size']:
                                    meta_data['headers'][inner_index]['max_size'] = len(col)
                            if not init_line_size > sample_size:
                                cols.append(new_line)
                        else:
                            print("column counts over , line number : " + str(init_line_size) + " cols: " + len(new_line))

                init_line_size = init_line_size+1
        if not transform_filter:
            print("no transformfilter exist")
            TransformFilter.objects.create(bundle_id=bundle_id,meta_data=json.dumps(meta_data))
        else:
            print("transformfilter exist")
            meta_data = json.loads(transform_filter.meta_data)
            meta_data['line_count'] = line_count
            transform_filter.meta_data = json.dumps(meta_data)
            transform_filter.save()
        transform_filter = TransformFilter.objects.filter(bundle_id=bundle_id).first()
        return Response({'csv_data': cols, 'meta_data': transform_filter.meta_data,'transformfilter_id':transform_filter.id})

    def post(self, request):
        bundle_id = request.data.get("bundle_id")
        meta_data = request.data.get("meta_data")
        transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
        transform_filter.meta_data = meta_data
        transform_filter.save()
        return Response({'inserted': True})


from django_project.celery import app as celery_app
from celery.schedules import crontab
from django_celery_beat.models import PeriodicTask, PeriodicTasks, IntervalSchedule, CrontabSchedule, SolarSchedule
import pytz
from django.utils.dateparse import parse_datetime


class LoaderSchedule(generics.GenericAPIView):
    def post(self, request):
        schedule_frequency = request.data.get('schedule_frequency')
        hours_of_day = request.data.get('hours_of_day')
        if len(hours_of_day) ==0:
            str_hours_of_day="*"
        else:
            str_hours_of_day = json.dumps(hours_of_day).strip("[").strip("]").replace('"','').replace(" ",'')
        days_of_week = request.data.get('days_of_week')
        if len(days_of_week) ==0:
            str_days_of_week="*"
        else:
            str_days_of_week = json.dumps(days_of_week).strip("[").strip("]").replace('"','').replace(" ",'')
        # weeks_of_month = request.data.get('weeks_of_month')
        days_of_month = request.data.get('days_of_month')
        if days_of_month is None:
            str_days_of_month ="0"
        else:
            str_days_of_month = str(days_of_month)
        months_of_year = request.data.get('months_of_year')
        if len(months_of_year) ==0:
            str_months_of_year = "*"
        else:
            str_months_of_year = json.dumps(months_of_year ).strip("[").strip("]").replace('"','').replace(" ",'')

        frequency = request.data.get('frequency')
        cur_utc = request.data.get('cur_utc')
        bundleId = request.data.get('bundleId')
        select_month=cur_utc[5:7]
        if select_month[0]=="0":
            select_month = select_month[1]
        select_date=cur_utc[8:10]
        if select_date[0]=="0":
            select_date = select_date[1]
        select_hour=cur_utc[11:13]
        if select_hour[0]=="0":
            select_hour = select_hour[1]
        select_minute=cur_utc[14:16]
        if select_minute[0]=="0":
            select_minute = select_minute[1]
        sel_datetime = parse_datetime(cur_utc)
        sel_datetime = pytz.timezone("UTC").localize(sel_datetime, is_dst=None)

        task_name = schedule_frequency + "__" + bundleId
        param_args = [bundleId, request.user.username]

        try:
            loader = Loader.objects.get(bundle_id=bundleId)
        except loader.DoesNotExist as err:
            loader=None
            return Response({"error":str(err)}, status=status.HTTP_400_BAD_REQUEST)
        try:
            pt = loader.schedule
        except Loader.DoesNotExist:
            pt=None

        if schedule_frequency=='None':
            if not pt is None:
                loader.schedule=None
                loader.save()
                cs = pt.crontab
                cs.delete()
                pt.delete()

        if schedule_frequency=='Once':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week="*"
                cs.day_of_month=select_date
                cs.month_of_year=select_month
                cs.save()
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
                                             task='loader.tasks.load_to_redshift',
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
                                             task='loader.tasks.load_to_redshift',
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
                                             task='loader.tasks.load_to_redshift',
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
                                             task='loader.tasks.load_to_redshift',
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
                                             task='loader.tasks.load_to_redshift',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency == 'Monthly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = str_days_of_week
                cs.day_of_month = str_days_of_month
                cs.month_of_year="*/"+str(frequency)
                cs.save()

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
                                             task='loader.tasks.load_to_redshift',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )
        if schedule_frequency == 'Yearly':

            if pt:
                cs = pt.crontab
                cs.minute=select_minute
                cs.hour=select_hour
                cs.day_of_week = str_days_of_week
                cs.day_of_month = str_days_of_month
                cs.month_of_year=str_months_of_year
                cs.save()

                pt.last_run_at = sel_datetime
                pt.name = task_name
                pt.save()
            else:
                cs = CrontabSchedule.objects.create(minute=select_minute,
                                               hour=select_hour,
                                               day_of_week=str_days_of_week,
                                               day_of_month=str_days_of_month,
                                               month_of_year=str_months_of_year)

                pt=PeriodicTask.objects.create(name=task_name,
                                             task='loader.tasks.load_to_redshift',
                                             args=json.dumps(param_args),
                                             enabled=1,
                                             crontab=cs,
                                             kwargs='{}',
                                             last_run_at=sel_datetime
                                             )

        PeriodicTasks.objects.update(last_update=timezone.now())
        loader = Loader.objects.get(bundle_id=bundleId)
        loader.schedule = pt
        loader.save()

        return Response({'start_utc_time': sel_datetime, 'schedule_type':schedule_frequency})


class BundleTransform(generics.GenericAPIView):

    def post(self, request):
        bundle_id = request.data.get('bundle_id')
        username = request.user.username
        loader = Loader.objects.filter(bundle_id=bundle_id).first()
        if loader.loader_type == 'folder':
            s3_resource = boto3.resource("s3")
            bucket = s3_resource.Bucket(loader.bucket_name)
            objs = list(bucket.objects.filter(Prefix=loader.s3_folder_key))
            s3_key_list = []
            for s3_file in objs:
                if s3_file.key[-3:] == 'csv' or s3_file.key[-3:] == 'txt':
                    s3_key_list.append(s3_file.key)
            list_key_count = len(s3_key_list)
            for file_number in range(0, list_key_count):
                file_name = s3_key_list[file_number].split('/')[-1]
                s3_key = s3_key_list[file_number]
                loader.s3_key = s3_key
                loader.s3_file_name = file_name
                loader.file_number = file_number
                loader.save()
                status1, error_info = ToRedshift(loader)
                if not status1:
                    break
        else:
            status1, error_info = ToRedshift(loader)
        if status1:
            return Response({"details": "Loader Running Success"}, status=status.HTTP_200_OK)
        else:
            return Response({"details": error_info}, status=status.HTTP_400_BAD_REQUEST)






class DeleteLoader(generics.GenericAPIView):

    def post(self,request):
        bundle_id = request.data.get('bundle_id')
        loaders = Loader.objects.filter(bundle_id=bundle_id)
        loaders.delete()
        return Response({'details': 'Deleted'},
                        status=status.HTTP_200_OK)


class StopLoader(generics.GenericAPIView):

    def post(self,request):
        bundle_id = request.data.get('bundle_id')
        Loader.objects.filter(bundle_id=bundle_id).update(status = 3,status_detail=' Stopped by user')
        return Response({'details': 'Deleted'},
                        status=status.HTTP_200_OK)


class CopyLoader(generics.GenericAPIView):

    def post(self,request):
        bundle_id = request.data.get('bundle_id')
        loaders = Loader.objects.filter(bundle_id=bundle_id)
        transform_filters = TransformFilter.objects.filter(bundle_id=bundle_id)

        if loaders:
            lst_loaders = []
            lst_transform_filter = []
            timestamp = str(datetime.now().strftime('%Y_%m_%d_%H_%M_%S'))
            for loader in loaders:
                # loader.pk = None
                loader.bundle_id = bundle_id + timestamp
                loader.status = 0
                loader_setting = loader.settings
                if loader_setting:
                    new_loader_setting = LoaderSetting.objects.create(
                        name = loader_setting.name,
                        redshift = loader_setting.redshift,
                        table_name = loader_setting.table_name,
                        is_header = loader_setting.is_header,
                        delimiter = loader_setting.delimiter,
                        encoding = loader_setting.encoding,
                        strategy = loader_setting.strategy,
                        sample_size = loader_setting.sample_size)
                    # new_loader_setting = new_loader_setting.save()
                else:
                    new_loader_setting = None
                new_loader = Loader.objects.create(bundle_id=bundle_id + timestamp, user=loader.user,
                       s3_key=loader.s3_key,settings=new_loader_setting,
                       status= 0,status_detail = 'Ready'
                       )
                # new_loader = new_loader.save()

            for transform_filter in transform_filters:

                new_instance = TransformFilter.objects.create(bundle_id = bundle_id + timestamp,
                                                              meta_data=transform_filter.meta_data)

        else:
            return Response({'details': 'No Loader found'},
                            status=status.HTTP_200_OK)


        return Response({'details': bundle_id + timestamp},
                        status=status.HTTP_200_OK)


