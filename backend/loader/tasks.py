import os
from celery import shared_task
from redshift.api import *
from datetime import datetime
from django.conf import settings
from loader.models import Loader, TransformFilter, LoaderError
import json
import csv
import re, math
from botocore.client import ClientError
from django_celery_beat.models import PeriodicTask, CrontabSchedule

@shared_task()
def load_to_redshift(bundle_id, username):
    loader = Loader.objects.filter(bundle_id=bundle_id).first()
    loader_settings = loader.settings
    try:
        pt = loader.schedule
    except PeriodicTask.DoesNotExist:

        return "Failed because pt is none."
    try:
        cron = pt.crontab
    except CrontabSchedule.DoesNotExist:

        return "Failed because cron is none"
    print("***** START ******------- Started Run Loader : " + loader_settings.name + " ----****** "+str(timezone.now()) + " ******")
    print("-1. Getting information -")
    print("--1.1 loader name : " + loader_settings.name + " --")
    print("--1.2 task name : " + pt.name + " --")
    print("--1.3 task run counts : " + str(pt.total_run_count) + " --")
    print("--1.4  cron info : " + str(cron) + " --")
    print("--1.5 starting time : " + str(timezone.now()) + " --")

    local_source_file_path = 'uploaded_files/' + username + "/" + loader.s3_file_name
    if not os.path.exists(local_source_file_path ):
        print('1.5_log ' + local_source_file_path + '" file exist in EC2. So will download from s3...')
        print("--- download source file from s3  , s3_key:" , loader.s3_key)
        f, st = downFileFromS3(loader.bucket_name, loader.s3_key, local_source_file_path )
        if not f:
            print('--- failed downloading from s3 to EC2. ---')
            print('--- details:' + st + ' ---')
            msg = 'failed downloading from s3 to EC2. details:' + st
            save_result(loader, 2, "Failed in downloading s3 source file , error: " + msg)
            return msg
    # Server currently shutdown when file size beyond 300 MB.
    file_size = os.stat(local_source_file_path )
    size = file_size.st_size / 1024 / 1024
    if size > 300:
        print('--1.log File Size is 300MB or larger')
    print("--1.6 s3 file url: " + loader.s3_url + " --")
    print("--1.7 s3 file size : " + str(file_size.st_size) + "byte, file size < 300 MB --")

    init_line_size = 0
    print("--1.8 check if redshift table exist --")
    table_exist = check_table_exist(loader_settings)
    if table_exist:
        f, i = get_last_number_id(loader_settings)
        # if f:
        #     init_line_size = i
        print("--- exist , record count: " + str(init_line_size) + " ---")
    else:
        print("--- No exist ---")

    print("-2. Transformation Started -")
    f, e, count = write_transformed_data(bundle_id, loader_settings, init_line_size)
    if not f:
        Loader.objects.filter(bundle_id=bundle_id).update(status=2, status_detail='Failed :' + e)
        return e
    local_transform_file_path= 'transformed_files/' + username + "/" + bundle_id + '.csv'
    s3_file_path = 'transformed_data/' + username + "/" + bundle_id + '.csv'
    print("-3. Upload local transformed file to s3 -")
    s3_client = boto3.client('s3')
    # s3_client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    #                          aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
    print("--3.1 started uploading  --")
    s3_client.upload_file(local_transform_file_path, settings.BUCKET_NAME, s3_file_path)
    print("--3.2 ended uploading  --")
    os.remove(local_transform_file_path)
    print("--3.3 removed local transformed file --")
    os.remove(local_source_file_path)
    print("--3.4 removed local source file. filename: ", local_source_file_path)
    meta_data = TransformFilter.objects.filter(bundle_id=bundle_id).first().meta_data
    meta_data = json.loads(meta_data)
    transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
    status1, status_detail = process_transformed_csv(loader_settings, loader, transform_filter, meta_data, count, table_exist)

    if status1:
        print("-6. Task clean step -")
        f = move_s3_file(loader)
        if f:
            print("-- 6.1 archived old file --")
            os.remove(local_source_file_path)
            print("-- 6.2 removed local source file --")
            print("**** END ***** " + status_detail + " *****" + str(timezone.now()) + "*****")
            return "success"
        else:
            return "failed"
    else:
        return status_detail


def ToRedshift(loader):
    loader_settings = loader.settings

    print("***** START ******------- Started Run Loader bundle_id: " + loader.bundle_id + " ----****** " + str(
        timezone.now()) + " ******")
    print("-1. Getting information -")
    print("--1.1 loader name : " + loader_settings.name + " --")
    print("--1.2 starting time : " + str(timezone.now()) + " --")

    local_file_path = 'uploaded_files/' + loader.user.username + "/" + loader.s3_file_name
    make_local_folder(loader.user.username, 'uploaded_files')
    if not os.path.exists(local_file_path):
        print('1.2_log ' + local_file_path + '" file exist in EC2. So will download from s3...')
        f, st = downFileFromS3(loader.bucket_name, loader.s3_key, local_file_path)
        if not f:
            return False, "csv file no exist on S3. s3_key: " + loader.s3_key

    file_size = os.stat(local_file_path)
    size = file_size.st_size / 1024 / 1024
    print("--1.2_log s3 file url: " + loader.s3_url + " --")
    print("--1.2_log s3 file size : " + str(size) + "MB, file size < 300 MB --")

    init_line_size = 0
    print("--1.3 check if redshift table exist --")
    table_exist = check_table_exist(loader_settings)
    if table_exist:
        f, i = get_last_number_id(loader_settings)
        # if f:
        #     init_line_size = i
        print("--- exist , record count: " + str(init_line_size) + " ---")
    else:
        print("--- No exist ---")
    print("--1.4 Load Type : " + loader.loader_type + " --")
    print("-2. Transformation Started -")
    f, e, count = write_transformed_data(loader.bundle_id, loader_settings, init_line_size)
    if not f:
        save_result(loader, 2, "Failed in transformation, error: " + e)
        print("--- Failed in transformation, error: " + e + "---")
        return f, e

    local_path = 'transformed_files/' + loader.user.username + "/" + loader.bundle_id + '.csv'
    s3_file_path = 'transformed_data/' + loader.user.username + "/" + loader.bundle_id + '.csv'
    print("-3. Upload local transformed file to s3 -")
    s3_client = boto3.client('s3')
    print("--3.1 started uploading  --")
    s3_client.upload_file(local_path, settings.BUCKET_NAME, s3_file_path)
    print("--3.2 ended uploading  --")
    os.remove(local_path)
    print("--3.3 removed local transformed file. filename: ", local_path)
    os.remove(local_file_path)
    print("--3.4 removed local source file. filename: ", local_file_path)
    meta_data = TransformFilter.objects.filter(bundle_id=loader.bundle_id).first().meta_data
    meta_data = json.loads(meta_data)
    transform_filter = TransformFilter.objects.get(bundle_id=loader.bundle_id)
    status1, error_info = process_transformed_csv(loader_settings, loader, transform_filter, meta_data, count,
                                                  table_exist)
    return status1, error_info

def move_s3_file(loader):
    timestamp = str(datetime.now().strftime('%Y_%m_%d_%H_%M_%S'))
    moved_s3_key = loader.s3_key.split(loader.s3_file_name)[0]+"archive/"+ timestamp + "_" + loader.s3_file_name
    source_s3_key = loader.s3_key
    print("moved_s3_key : " + moved_s3_key)
    print("source_s3_key : " + source_s3_key)
    try:
        s3_resource = boto3.resource('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        s3_resource.Object(loader.bucket_name, moved_s3_key).copy_from(CopySource=loader.bucket_name + "/" + source_s3_key)
        s3_resource.Object(loader.bucket_name, source_s3_key).delete()
    except ClientError as exec:
        print("--- failed archiving , reason: " + str(exec) + " ---")
        return False
    return True


def downFileFromS3(bucket_name, s3_key, local_file_path):
    try:
        s3 = boto3.resource('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID, aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        s3.Bucket(bucket_name).download_file(s3_key, local_file_path)
    except ClientError as e:
        return False, str(e)
    return True, 'success'


def make_local_folder(username, directory):
    try:
        # owner = "ec2-user"
        # group = "ec2-user"
        if not os.path.exists(directory):
            # print("---------No exist " + directory + "---------")
            os.makedirs(directory)
            if os.path.exists(directory):
                # print("---------Created " + directory + " folder---------")
                # print("---------Current uid: " + str(os.stat(directory).st_uid) + ". ---------")
                # print("---------Current gid: " + str(os.stat(directory).st_gid) + ". ---------")
                mode = os.stat(directory).st_mode
                # print("---------Current mode : " + str(mode) + "---------")
                os.chmod(directory, 0o7777)
                mode = os.stat(directory).st_mode
                # print("---------Changed mode : " + str(mode) + "---------")

        directory = directory + "/" + username
        if not os.path.exists(directory):
            # print("---------No exist " + directory + "---------")
            os.makedirs(directory)
            if os.path.exists(directory):
                # print("---------Created " + directory + " folder---------")
                # print("---------Current uid: " + str(os.stat(directory).st_uid) + ". ---------")
                # print("---------Current gid: " + str(os.stat(directory).st_gid) + ". ---------")
                mode = os.stat(directory).st_mode
                # print("---------Current mode : " + str(mode) + "---------")
                os.chmod(directory, 0o7777)
                mode = os.stat(directory).st_mode
                # print("---------Changed mode : " + str(mode) + "---------")

    except Exception as exc:
        print("---------error : " + str(exc) + "---------")


def create_loaders(user_id, s3_url, s3_key, bundle_id, s3_file_name, s3_folder_key, file_number, bucket_name, loader_type):

        Loader.objects.create(
            user_id=user_id,
            bundle_id=bundle_id,
            s3_url=s3_url,
            s3_key=s3_key,
            s3_file_name=s3_file_name,
            s3_folder_key=s3_folder_key,
            file_number=file_number,
            bucket_name=bucket_name,
            loader_type=loader_type
        )

def getReadSize(filedata, sample_size, csv_line_spliter):
    csv_lines = filedata.split(csv_line_spliter)
    linesize = len(csv_lines[0])
    return (linesize * sample_size + sample_size)

def save_result(loader, flag_val, status_detail):
    loader.status = flag_val
    loader.status_detail = status_detail
    loader.modified_date = datetime.now()
    loader.save()
    print("------- saved : " + str(flag_val))
    return


def process_transformed_csv(loader_setting, loader, transform_filter, meta_data, count, table_exist):
    redshift_id = loader_setting.redshift_id
    table_name = loader_setting.table_name
    strategy = loader_setting.strategy
    conn, message = get_redshit_connection(redshift_id)
    if not conn:
        save_result(loader, 2, "Failed - DB Connection Error")
        return False, message

    print("-4. Make table step -")
    crete_table_flag, msg = createTable(strategy, conn, table_name, transform_filter, loader, table_exist)
    if not crete_table_flag:
        save_result(loader, 2, "Failed in creating table, error: "+msg)
        return crete_table_flag, msg
    print("-5. Copy step (details: copy transformed s3 file to redshift) -")

    date_col = [i for i in meta_data['headers'] if i['data_type'] == "Date"]
    str_format1 = ''
    str_format2 = ''
    if date_col:
        date_formate = date_col[0]['date_type']
        if date_formate:
            str_format1 = "DATEFORMAT AS '" + date_formate +"'"
        else:
            str_format1 = "DATEFORMAT AS 'auto'"
        for date_c in date_col:
            if not date_formate == date_c['date_type']:
                str_format1 = "DATEFORMAT AS 'auto'"

    time_col = [i for i in meta_data['headers'] if i['data_type'] == "Date Time"]
    if time_col:
        time_format = time_col[0]['time_type']
        if time_format:
            str_format2 = "TIMEFORMAT AS '" + time_format +"'"
        else:
            str_format2 = "TIMEFORMAT AS 'auto'"
        for time_c in time_col:
            if not time_format == time_c['time_type']:
                str_format2 = "TIMEFORMAT AS 'auto'"

    str_format1 = str_format1+" " + str_format2
    print("--- made copy query --")
    f, error = copy_s3_to_redshift(conn, loader_setting, loader, str_format1)

    if f:

        status_detail = 'Success - Lines : ' + str(count) + " / " + str(meta_data['line_count'])
        save_result(loader, 1, status_detail)

    else:
        status_detail = 'Failed - Line : ' + str(error[0][2]) + ', Reason: "' + error[0][6] + '", Type: Redshift copy error'
        save_result(loader, 2, status_detail)

    return f, status_detail


# def updateS3Meta(loader, flag):
#     conn = tinys3.Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)
#     # Adding metadata for a key
#
#     if flag:
#         conn.update_metadata(loader.s3_key, {'x-amz-meta-redshift-status': 'True'}, settings.BUCKET_NAME)
#     else:
#         conn.update_metadata(loader.s3_key, {'x-amz-meta-redshift-status': 'False'}, settings.BUCKET_NAME)
#     return 0


def createTable(strategy, conn, table_name, transform_filter, loader, table_exist):

    print("--- strategy: " + strategy + ", old table exist: " + str(table_exist) + " ---")
    cur = conn.cursor()
    if strategy == "Replace":
        flag_check_archive_table_exist = check_archive_table_exist(loader.settings)
        if table_exist and flag_check_archive_table_exist:
            try:
                archive_query = "INSERT INTO " + loader.settings.schema + "." + table_name + "_ARCHIVE SELECT * FROM " + \
                              loader.settings.schema + "." + table_name + "; DELETE FROM " + loader.settings.schema + \
                              "." + table_name
                print("--- archive old table (details: insert data in archive table and then delete old table --")
                cur.execute(archive_query)
                cur.close()
                conn.commit()
                return True, 'Archived in success.'
            except:
                # print(traceback.format_exc())
                # print(sys.exc_info())
                conn.rollback()
                msg = sys.exc_info()[1]
                print("--- failed archive --")
                print('--- query : " ' + archive_query + ' "---')
                msg = "--- reason : ' " + str(msg) + " '---"
                print(msg)
                loader.status = 2
                loader.status_detail = msg
                loader.save()
                return False, msg
        if table_exist and not flag_check_archive_table_exist:
            try:
                alter_query = "ALTER TABLE " + loader.settings.schema + "." + table_name + " RENAME TO " + \
                              table_name + "_ARCHIVE"
                print("--- alter old table because of replace mode ---")
                cur.execute(alter_query)
                cur.close()
                conn.commit()

            except:
                print(sys.exc_info())
                conn.rollback()
                msg = sys.exc_info()[1]
                print("--- failed altering ---")
                print('--- query : "' + alter_query + ' "---')
                msg = "--- alter failed Reason : " + str(msg) + " ---"
                print(msg)
                loader.status = 2
                loader.status_detail = msg
                loader.save()
                return False, msg
    if not table_exist or strategy == "Replace":
        create_query = get_create_query_with_header_type(table_name, transform_filter, loader)
        print("--- create new table since table no exist ---")
        try:
            cur = conn.cursor()
            cur.execute(create_query)
            cur.close()
            conn.commit()
            return True, 'Table created successfully.'
        except:
            # print(traceback.format_exc())
            # print(sys.exc_info())
            conn.rollback()
            msg = sys.exc_info()[1]
            print("--- failed creating ---")
            print("--- query : ' " + create_query + " '---")
            print("--- reason: " + str(msg) + " ---")
            msg = "Failed - Reason : " + str(msg)

            loader.status = 2
            loader.status_detail = msg
            loader.save()
            return False, msg
    return True, ''


def write_transformed_data(bundle_id, loader_settings, init_line_size):
    print("--2.1 getting raw from csv --")
    loader = Loader.objects.get(bundle_id=bundle_id)
    transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
    meta_data = json.loads(transform_filter.meta_data)
    col_counts = len(meta_data['headers'])

    total_lines = []
    if not loader:
        return []

    csv_line_spliter = '\n'
    # for index, loader in enumerate(loader):
    delimiter = loader.settings.delimiter
    if delimiter == 'tab':
        delimiter = '\t'
    encoding = loader.settings.encoding
    file_name = 'uploaded_files/' + str(loader.user) + "/" + loader.s3_file_name

    mode = None
    line_count = 0
    all_count = 0
    block_size = 50 * 1000
    block_number = 0
    percentage = 0
    if not loader.settings.is_header:
        init_line_size = init_line_size + 1
    with open(file_name, encoding=encoding, newline=csv_line_spliter) as csvfile:
        csv_lines = csv.reader(csvfile, delimiter=delimiter, quotechar='"', skipinitialspace=True)
        all_count = len(list(csv_lines))
        csvfile.seek(0)
        for line in csv_lines:
            new_line = [str(init_line_size)]
            for col in line:
                new_line.append(col)
            if len(new_line) == col_counts:
                total_lines.append(new_line)
            else:
                print("--2.1.<error> column counts over than headers , line number : " + str(init_line_size) + " cols: " + str(line)+ " --")
            if len(total_lines) % block_size == 0:
                block_number = block_number + 1
                if mode == 'w':
                    mode = 'a'

                if mode is None:
                    mode = 'w'
                    if loader.settings.is_header:
                        total_lines = total_lines[1:]

                lines = get_extra_cols_data(bundle_id, total_lines)  # remove line that 'is_deleted'  is true
                f1, e, lines = get_filtered_data(bundle_id, lines)  # filter cols that 'filter_type' exist
                if not f1:
                    return f1, e, 0
                f2, e, lines = get_transformed_type_data(bundle_id, lines)
                if not f2:
                    return f2, e, 0

                f3, e, c = csv_writer(lines, bundle_id, delimiter, encoding, mode)
                if not f3:
                    return f3, e, 0
                line_count = line_count + c
                percentage = block_number * block_size * 100 / all_count

                print("---2_log percent: ", str(int(percentage)), "% all_line_count: ", str(all_count), " current_line_count:", str(line_count), "block_size: ", str(block_size))
                total_lines = []
            init_line_size = init_line_size + 1
        # transform & write (file size less than block_size or final block)
        if len(total_lines) != 0:
            block_number = block_number + 1
            if mode == 'w':
                mode = 'a'

            if mode is None:
                mode = 'w'
                if loader.settings.is_header:
                    total_lines = total_lines[1:]

            lines = get_extra_cols_data(bundle_id, total_lines)  # remove line that 'is_deleted'  is true
            f1, e, lines = get_filtered_data(bundle_id, lines)  # filter cols that 'filter_type' exist
            if not f1:
                return f1, e, 0
            f2, e, lines = get_transformed_type_data(bundle_id, lines)
            if not f2:
                return f2, e, 0

            f3, e, c = csv_writer(lines, bundle_id, delimiter, encoding, mode)
            if not f3:
                return f3, e, 0
            line_count = line_count + c
            percentage = 100
            print("---2_log percent: ", str(percentage), "% all_line_count: ", str(all_count), " current_line_count:",
                  str(line_count), "block_size: ", str(block_size))

    meta_data['line_count'] = str(line_count)
    transform_filter.meta_data = json.dumps(meta_data)
    transform_filter.save()

    return True, '', line_count


def get_transformed_type_data(bundle_id, lines):
    print("--2.4 data type transformation --")
    transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
    loader = Loader.objects.get(bundle_id=bundle_id)
    meta_data = json.loads(transform_filter.meta_data)
    new_lines = []
    error_limit = int(loader.settings.skip_errors)
    error_count = 0
    for line in lines:
        f, e,  line = transform_type_data_singlie_line(line, meta_data)
        if f:
            new_lines.append(line)
        else:
            error_count = error_count + 1
            print("--2.4.<error> reason :" + e)
            print(str(line)[:10])
            LoaderError.objects.create(loader_id=loader.id, bundle_id=bundle_id, error_type='data type transform',
                                       reason=e, raw_record=str(line)[:900])
            if error_count > error_limit:
                print("--2.4.<error> failed errors over limit --")
                return False, 'errors over ' + str(error_limit), new_lines
    return True, '', new_lines


def transform_type_data_singlie_line(line, meta_data):
    headers = meta_data.get('headers')
    real_headers = []
    for header in headers:
        if not header.get('is_deleted'):
            real_headers.append(header)
    # print("-------removed headers deleted is true. so real headers : " + str(real_headers) + "--------")
    for index, header in enumerate(real_headers):
        s = line[index]
        if str.upper(s) == 'NULL':
            s = ''
            # print(str(header) + " : " + str(line[index]))

        if header.get('data_type') == "Long" or header.get('data_type') == "Integer":
            # print("--data type : " + header.get('data_type'))
            try:
                if not s == '':
                    s = int(s)

            except Exception as exc:
                return False, str(exc) + "," + 'col_name: ' + header.get('col_name') + "," + 'col_index: ' + str(
                    header.get('col_index')), line
            line[index] = str(s)
            # if index == 0:
            #     print("------"+line[index] +  "can be tranform as " + header.get('data_type') + "type----")

        if header.get('data_type') == "Decimal":
            try:
                if not s == '':
                    s = float(line[index])
            except Exception as exc:
                return False, str(exc) + "," + 'col_name: ' + header.get('col_name') + "," + 'col_index: ' + str(header.get('col_index')), line
            line[index] = s
        if header.get('data_type') == "Boolean":

            if s == '' or s == '0' or s == '1' or str(s).upper() == 'TRUE' \
                    or str(s).upper() == 'FALSE' or s == 0 or s == 1:
                s = str(s)
            else:
                return False, "No boolean value, col_name: " + header.get('col_name') + "," + 'col_index: ' + str(header.get('col_index')), line
            line[index] = s
    return True, '', line


def get_filtered_data(bundle_id, lines):
    transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
    loader = Loader.objects.get(bundle_id=bundle_id)
    meta_data = json.loads(transform_filter.meta_data)
    filters = get_filters_from_meta_data(meta_data)
    print("--2.3 filtering step --")
    print("--- filters : " + str(filters) + " ---")
    new_lines = []
    error_limit = int(loader.settings.skip_errors)
    error_count = 0
    for line in lines:
        f, e, line = filter_single_line(line, filters)
        if f:
            new_lines.append(line)
        else:
            error_count = error_count + 1
            print("--2.3.<error> reason : " + e + " --")
            LoaderError.objects.create(loader_id=loader.id, bundle_id=bundle_id, error_type='filter transform',
                                       reason=e, raw_record=str(line)[:900])
            if error_count > error_limit:
                print("--2.3.<error> failed errors over limit --")
                return False, 'errors over ' + str(error_limit), new_lines

    return True, '', new_lines


def filter_single_line(line, filters):
    for key in filters:
        key = int(key)
        for _filter in filters[key]:
            s = line[key]
            if str.upper(s) == 'NULL':
                s = ''

            if _filter.get('filter_type') == 'text_transform':
                text_transform_type = _filter.get('transform_value')
                if text_transform_type == 'uppercase':
                    s = s.upper()
                elif text_transform_type == 'lowercase':
                    s = s.lower()
                elif text_transform_type == 'capitalize':
                    s = s.capitalize()
                elif text_transform_type == 'titleize':
                    s = s.title()
                elif text_transform_type == 'snake_case':
                    s = s.lower()
                    s = s.replace(' ','_')
                elif text_transform_type == 'trim':
                    s = s.strip()
                line[key] = s

            if _filter.get('filter_type') == 'math_add':
                input_value = _filter.get('input_value')
                a = 0
                b = 0
                try:
                    a, b = float(s), float(input_value)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get('filter_type'), line
                s = str(a + b)
                line[key] = s

            if _filter.get('filter_type') == 'math_subtraction':
                input_value = _filter.get('input_value')
                a = 0
                b = 0
                try:
                    a, b = float(s), float(input_value)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                s = str(a - b)
                line[key] = s

            if _filter.get('filter_type') == 'math_multiply':
                input_value = _filter.get('input_value')
                a = 0
                b = 0
                try:
                    a, b = float(s), float(input_value)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                s = str(a * b)
                line[key] = s

            if _filter.get('filter_type') == 'math_divide':
                input_value = _filter.get('input_value')
                a = 0
                b = 0
                try:
                    a, b = float(s), float(input_value)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                s = str(a / b)
                line[key] = s

            if _filter.get('filter_type') == 'math_percent':
                a = 0
                b = 100
                try:
                    a = float(s)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                s = str(a / b)
                line[key] = s

            if _filter.get('filter_type') == 'math_log':
                input_value = _filter.get('input_value')
                a = 0
                b = 0
                try:
                    a, b = float(s), float(input_value)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                    'filter_type'), line
                try:
                    s = str(math.log10(a) / math.log10(b))
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                line[key] = s

            if _filter.get('filter_type') == 'math_exp':
                input_value = _filter.get('input_value')
                a = 0
                try:
                    a = float(s)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                try:
                    s = str(math.exp(a))
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                line[key] = s

            if _filter.get('filter_type') == 'extract_regex':
                regex_value = _filter.get('regex_value')
                try:
                    result = re.search(regex_value, s)
                    result = result.group(0)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                line[key] = result

            if _filter.get('filter_type') == 'extract_text':
                begin_value, end_value, occur_type = _filter.get('start_value'), _filter.get('end_value'), _filter.get(
                    'occur_type')
                if occur_type == '1':
                    pattern = '(.*)'
                else:
                    pattern = pattern = '(.*?)'
                try:
                    result = re.search(begin_value + pattern + end_value, s)
                    result = result.group(1)
                except Exception as exc:
                    return False, str(exc) + "," + 'col_index: ' + str(key) + " filter_type: " + _filter.get(
                        'filter_type'), line
                line[key] = result

            if _filter.get('filter_type') == 'search':
                find_value, replace_value = _filter.get('find_value'), _filter.get('replace_value')
                try:
                    if _filter.get('case_sensitive'):
                        line[key] = line[key].replace(find_value, replace_value)
                    else:
                        find_value = find_value.lower()
                        line[key] = line[key].lower()
                        line[key] = line[key].replace(find_value, replace_value)

                except IndexError:
                    pass
    return True, '', line



def isfloat(value):
  try:
    float(value)
    return True
  except ValueError:
    return False


def get_filters_from_meta_data(meta_data):
    filters = {}
    headers = meta_data.get('headers')
    col_index_lst = []
    for index, header in enumerate(headers):
        if (header.get('col_index') or header.get('col_index') == 0) and not header.get('is_deleted'):
            filter_index = len(col_index_lst)
            col_index_lst.append(header.get('col_index'))
            filters[filter_index] = header.get('filters', [])

    return filters


def get_col_indexes(headers):
    col_index_lst = []
    for index, header in enumerate(headers):
        if (header.get('col_index') or header.get('col_index') == 0) and not header.get('is_deleted'):
            col_index_lst.append(header.get('col_index'))
    return col_index_lst


def format_lines_acc_to_col_indexes(lines, col_index_lst):
    new_lines = []
    for line in lines:
        new_line = []
        for index in col_index_lst:
            try:
                new_line.append(line[index])
            except IndexError:
                continue

        new_lines.append(new_line)
    return new_lines


def get_extra_cols_data(bundle_id, lines):
    transform_filter = TransformFilter.objects.get(bundle_id=bundle_id)
    meta_data = json.loads(transform_filter.meta_data)
    headers = meta_data.get('headers')
    col_index_lst = get_col_indexes(headers)
    # col_index_lst is now a list of index of cols required
    lines = format_lines_acc_to_col_indexes(lines, col_index_lst)
    print("--2.2.remove headers 'deleted' is true --")
    return lines


def csv_writer(data, bundle_id, delimiter, encoding, mode='w'):
    """
    Write data to a CSV file path
    param : mode ='w', 'a'
    """
    print("--2.5 writing csv file --")
    loader = Loader.objects.get(bundle_id=bundle_id)
    directory = 'transformed_files/' + str(loader.user)
    if not os.path.exists(directory):
        make_local_folder(loader.user.username, 'transformed_files')
        print("--- created user folder : "+ loader.user.username + " since this is first loader. ---")
    path = 'transformed_files/' + str(loader.user)+"/" + bundle_id + '.csv'

    with open(path, mode,  encoding=encoding) as csv_file:
        writer = csv.writer(csv_file, delimiter=delimiter)
        for line in data:
            writer.writerow(line)
    count = len(data)

    return True, '', count

