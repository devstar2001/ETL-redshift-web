import psycopg2
import tinys3
import boto3
import json
import traceback
import sys

from django.conf import settings
# from .serializers import UserSerializer
from rest_framework import generics, status, permissions
from django.contrib.auth import authenticate
from django_project import key_config

from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from redshift.serializers import RedshiftDbSerializer, RedshiftDbCopySerializer , UserEmailSerializer
from .models import RedShiftDb,UserEmail
import csv
import base64
import os
import pickle
from loader import tasks as loader_tasks

User = get_user_model()


# def get_create_query(headers, table_name):
#     base_query = 'CREATE TABLE {0} ({1})'
#     cols = ''
#     for header in headers:
#         header = header.replace(u'\ufeff', '')
#         header_new = ''.join(e for e in header if e.isalnum())
#         cols = cols + ' "' + header_new + '" TEXT,'
#     cols = cols[:-1]
#     queryFo = base_query.format(table_name, cols)
#     print(queryFo)
#     return queryFo


def get_create_query_with_header_type(table_name, transform_filter, loader):
    meta_data = json.loads(transform_filter.meta_data)
    col_names = []
    data_types = []
    max_sizes = []
    is_keys = []

    for header_dict in meta_data.get('headers'):
        if not header_dict.get('is_deleted'):
            col_names.append(header_dict.get('col_name'))
            data_types.append(header_dict.get('data_type'))
            max_sizes.append(header_dict.get('max_size'))
            is_keys.append(header_dict.get('is_key'))

    dict_data_types = {'Text': 'TEXT', 'Date': 'DATE', 'Date Time': 'TIMESTAMP', 'Integer': 'INTEGER','Long': 'BIGINT',
                       'Decimal': 'FLOAT', 'Boolean': 'BOOLEAN'}

    base_query = 'CREATE TABLE {0} ({1})'
    cols = ''
    pk_cols = ''
    for col_name, data_type, max_size, is_key in zip(col_names, data_types, max_sizes, is_keys):
        col_name = col_name.replace(u'\ufeff', '')
        header_new = ''.join(e for e in col_name if e.isalnum())
        if col_name == 'de_id':
            header_new = col_name
        if dict_data_types.get(data_type) == 'TEXT':
            if max_size > 256:
                if max_size < 4096 :
                    cols = cols + ' "' + header_new + '" ' + 'varchar(max)'
                else:
                    cols = cols + ' "' + header_new + '" ' + 'varchar(65535)'
            else:
                cols = cols + ' "' + header_new + '" ' + 'varchar(256)'
        else:
            if dict_data_types.get(data_type) == 'INTEGER':
                if max_size > 9:
                    cols = cols + ' "' + header_new + '" ' + 'BIGINT'
                else:
                    cols = cols + ' "' + header_new + '" ' + 'INTEGER'
            else:
                cols = cols + ' "' + header_new + '" ' + dict_data_types.get(data_type)
        if is_key:
            pk_cols = pk_cols + '"' + header_new + '",'
        cols = cols + ','
    if not pk_cols == '':
        pk_cols = pk_cols[:-1]
        cols = cols + ' PRIMARY KEY(' + pk_cols + ')'
    else:
        cols = cols[:-1]
    query_new_table = base_query.format(loader.settings.schema+"."+table_name, cols)
    return query_new_table


def get_redshit_connection(redshift_id):
    redshift = RedShiftDb.objects.filter(id=redshift_id).first()
    con = None
    try:
        if redshift:
            con = psycopg2.connect(dbname=redshift.name, host=redshift.host,
                                   port=redshift.port, user=redshift.username, password=redshift.password)
            message = 'Connected to the Selected Database'
    except:
        print(traceback.format_exc())
        print(sys.exc_info())
        con = None
        message = 'Unable to Connect to the Selected Database'
    return con, message


def get_redshit_connection_by_user(username):
    redshift = RedShiftDb.objects.filter(username=username).first()
    con = None
    try:
        if redshift:
            con = psycopg2.connect(dbname=redshift.name, host=redshift.host,
                                   port=redshift.port, user=redshift.username, password=redshift.password)
            message = 'Connected to the Selected Database'
    except:
        print(traceback.format_exc())
        print(sys.exc_info())
        con = None
        message = 'Unable to Connect to the Selected Database'
    return con, message


def check_table_exist(loader_settings):
    redshift_id = loader_settings.redshift_id
    table_name = loader_settings.table_name
    schema = loader_settings.schema
    table_name = table_name.replace(schema + '.', '')
    check_query = "SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = '{1}' AND (table_name = '{0}' OR table_name = LOWER('{0}')) )".format(
        table_name, schema)
    print('---" ' + check_query + ' "---')
    conn, message = get_redshit_connection(redshift_id)
    if not conn:
        return False
    cur = conn.cursor()
    try:
        cur.execute(check_query)
        result = cur.fetchall()
        cur.close()
        conn.commit()
        return result[0][0]
    except:
        print(traceback.format_exc())
        print(sys.exc_info())
        # import pdb
        # pdb.set_trace()
        conn.rollback()
    return False

def check_archive_table_exist(loader_settings):
    redshift_id = loader_settings.redshift_id
    table_name = loader_settings.table_name
    schema = loader_settings.schema
    table_name = table_name.replace(schema + '.', '')
    table_name = table_name + "_ARCHIVE"
    check_query = "SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_schema = '{1}' AND (table_name = '{0}' OR table_name = LOWER('{0}')) )".format(
        table_name, schema)
    conn, message = get_redshit_connection(redshift_id)
    if not conn:
        return False
    cur = conn.cursor()
    try:
        # print(check_query)
        cur.execute(check_query)
        result = cur.fetchall()
        cur.close()
        conn.commit()
        # print(result[0][0])
        return result[0][0]
    except:
        print(traceback.format_exc())
        print(sys.exc_info())
        # import pdb
        # pdb.set_trace()
        conn.rollback()
    return False


def get_last_number_id(loader_settings):
    redshift_id = loader_settings.redshift_id
    table_name = loader_settings.table_name
    schema = loader_settings.schema
    query = "SELECT count(*) FROM " + schema + "." + table_name
    conn, message = get_redshit_connection(redshift_id)
    if not conn:
        return False, 0
    cur = conn.cursor()
    try:
        # print(query)
        cur.execute(query)
        result = cur.fetchall()
        cur.close()
        conn.commit()
        # print(result[0][0])
        return True, int(result[0][0])
    except:
        # print(traceback.format_exc())
        # print(sys.exc_info())
        # import pdb
        # pdb.set_trace()
        conn.rollback()
    return False, 0


def copy_s3_to_redshift(conn,loader_settings, loader, str_format):
    table_name = loader_settings.table_name
    delimiter = ","
    schema = loader_settings.schema
    cur = conn.cursor()
    s3_file_path = 'transformed_data/' + str(loader.user) + "/" + loader.bundle_id + '.csv'
    s3_key = 's3://{0}/{1}'.format(settings.BUCKET_NAME, s3_file_path)
    region = settings.REGION_NAME
    copy_sql = """COPY {0} FROM '{1}' CREDENTIALS 'aws_access_key_id={2};aws_secret_access_key={3}'  CSV QUOTE '"'  delimiter '{4}' region '{5}' {6}""".format(
        schema + "." + table_name, s3_key, settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY
        ,  delimiter, region, str_format)

    log_copy_sql = """COPY {0} FROM '{1}' CREDENTIALS 'x:s'  CSV QUOTE '"'  delimiter '{2}' region '{3}' {4}""".format(
        schema + "." + table_name, s3_key, delimiter, region, str_format)

    errorQuery = """select le.starttime, d.query, d.line_number, d.colname, d.value,le.raw_line, le.err_reason from stl_loaderror_detail d, stl_load_errors le where d.query = le.query order by le.starttime desc limit 1 """
    try:
        print("--- copying start " + str(timezone.now()) + " --")
        cur.execute(copy_sql)
        cur.close()
        conn.commit()
        print("--- copying end " + str(timezone.now()) + " --")
        # s3_conn = tinys3.Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)
        # Adding metadata for a key
        # s3_conn.update_metadata(
        #     loader.s3_key, {'x-amz-meta-redshift-status': 'True'}, settings.BUCKET_NAME)

        return True, 'copied'
    except:
        print("--- failed copying ---")
        print("--- query: ' " + log_copy_sql + " '---")
        conn.rollback()
        cur.execute(errorQuery)
        result = cur.fetchall()
        conn.commit()
        # print(traceback.format_exc())
        # print(sys.exc_info())
        conn.rollback()
        print("--- failed reason: " + str(result) + " ---")
        return False, result


class RedShiftDbList(generics.ListCreateAPIView):
    queryset = RedShiftDb.objects.all()
    serializer_class = RedshiftDbSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def list(self, request):

        queryset = self.get_queryset()
        if not request.user.is_anonymous():
            queryset = queryset.filter(user=request.user)
        serializer = RedshiftDbSerializer(queryset, many=True)
        return Response(serializer.data)


class RedShiftDbUpdate(generics.RetrieveUpdateDestroyAPIView):
    queryset = RedShiftDb.objects.all()
    serializer_class = RedshiftDbSerializer


class RedShiftSchemaList(generics.GenericAPIView):

    def get(self, request):
        db_id = int(request.query_params.get('target_id', '0'))
        conn, msg = get_redshit_connection(db_id)
        if conn:
            schema_query = "SELECT * from PG_NAMESPACE ;"
            cur = conn.cursor()
            try:
                cur.execute(schema_query)
                result = cur.fetchall()
                cur.close()
                conn.commit()
                schemas = []
                for s in result:
                    if not (s[0]=='pg_toast' or s[0]=='pg_internal' or s[0]=='pg_temp_1' or s[0]=='pg_catalog' or s[0]=='information_schema'):
                        temp_obj = {}
                        temp_obj['schema_name'] = s[0]
                        schemas.append(temp_obj)
                # print(result)
                # print(schemas)
                return Response({'schemas': schemas}, status=200)
            except:
                message = 'Schema getting error in Redshift Database.'
                print(traceback.format_exc())
                print(sys.exc_info())
                conn.rollback()
                return Response({'status': False, 'error': message}, status=400)
        else:
            return Response({'status': False, 'error': msg}, status=400)


class UserEmailList(generics.ListCreateAPIView):
    queryset = UserEmail.objects.all()
    serializer_class = UserEmailSerializer


class RedShiftDbTest(generics.CreateAPIView):
    queryset = RedShiftDb.objects.all()
    serializer_class = RedshiftDbSerializer

    def post(self, request):
        redshift_id = self.request.data.get('redshift_id', 1)
        con, msg = get_redshit_connection(redshift_id)
        if con:
            return Response({'status': True, 'msg': msg})
        else:
            return Response({'status': False, 'error': msg}, status=400)


from loader.models import Loader, TransformFilter, LoaderSetting
class RedshiftTables(generics.GenericAPIView):
    def get(self, request):
        r_user = request.user
        loaders = Loader.objects.filter(user=r_user)
        table_list = []
        for loader in loaders:
            if loader.settings and 'Success' in loader.status_detail:
                if loader.settings.table_name:
                    td = {
                        'bundle_id':loader.bundle_id,
                        'schema':loader.settings.schema,
                        'table_name':loader.settings.table_name
                    }
                    table_list.append(td)

        return Response({'tables':table_list})


class RedSqltocsv(generics.CreateAPIView):
    queryset = RedShiftDb.objects.all()
    serializer_class = RedshiftDbSerializer

    def post(self, request):
        r_user = request.user
        bundle_id = request.data.get('bundle_id')
        bucket_name = request.data.get('bucket_name')
        if bucket_name == '' or bucket_name is None:
            bucket_name = settings.BUCKET_NAME
        if bundle_id == '' or bundle_id is None:
            conn, message = get_redshit_connection_by_user(r_user.username)
        else:
            loader = Loader.objects.get(bundle_id=bundle_id)
            conn, message = get_redshit_connection(loader.settings.redshift_id)
        s3_folder = request.data.get('s3_folder')
        s3_file = request.data.get('s3_file')
        query = request.data.get('query')
        if loader is None and loader.settings is None:
            return Response()
        if loader.settings.redshift_id is None:
            return Response()

        headers = []
        header_query = ''
        start_point = str.upper(query).find('SELECT') + 6
        end_point = str.upper(query).find('FROM') - 1
        header_from_sql = query[start_point: end_point]
        cur = conn.cursor()
        if '*' in header_from_sql:
            if 'COUNT(*)' in str(header_from_sql).upper():
                headers.append('COUNT')
            else:
                header_query = """SELECT column_name FROM information_schema.columns WHERE TABLE_NAME='""" + str(loader.settings.table_name).lower() + """' AND TABLE_SCHEMA='""" + loader.settings.schema + """'"""
                try:
                    cur.execute(header_query)
                    headers = [col[0] for col in cur.fetchall()]
                except:
                    print(traceback.format_exc())
                    print(sys.exc_info())
                    conn.rollback()
                    return Response({"details": sys.exc_info()}, status=400)
                headers_string = str(headers)
                headers_string = headers_string.replace("[","")
                headers_string = headers_string.replace("]","")
                headers_string = headers_string.replace("\\","")
                headers_string = headers_string.replace("'",'"')
                p_select_last = str(query).upper().find('SELECT') + 6
                p_from_start = str(query).upper().find('FROM')
                q1 = query[:p_select_last]
                q2 = query[p_from_start:]
                query = q1 + " " + headers_string + " " + q2
        else:
            header_from_sql = header_from_sql.replace(' ', '')
            headers = str(header_from_sql).split(',')
            print(headers)

        if query == '':
            sql_string = "SELECT * FROM redshift_etl." + loader.settings.table_name
        else:
            sql_string = query
        if s3_file == '':
            file_name = loader.settings.table_name + '.csv'
        else:
            file_name = s3_file
        if r_user.is_superuser:
            s3_file_path = s3_folder + "/" + file_name
        else:
            s3_file_path = r_user.username + "/" + s3_folder + "/" + file_name
        s3_file_path = s3_file_path.replace('//', '/')
        if s3_file_path[0] == '/':
            s3_file_path = s3_file_path[1:]
        if not conn:
            return False
        directory = 'transformed_files/' + str(loader.user)
        if not os.path.exists(directory):
            loader_tasks.make_local_folder(loader.user.username, 'transformed_files')
        local_download_file = 'transformed_files/' + r_user.username + "/" + file_name
        try:

            with open(local_download_file, 'w') as fp:
                i = 1
                for item in headers:
                    if i == len(headers):
                        fp.write("%s\n" % item)
                    else:
                        fp.write("%s," % item)
                    i = i + 1

            block_number = 0
            block_size = 1000
            with open(local_download_file, 'a', newline='') as fp:
                csvw = csv.writer(fp)
                with conn.cursor(name='name_of_cursor') as cur:
                    cur.itersize = block_size
                    cur.execute(sql_string)
                    for row in cur:
                        # rows = cur.fetchmany(block_size)
                        csvw.writerow(row)
                        block_number = block_number + 1
                        if block_number % 50000 == 0:
                            print("row_number: ", block_number)

            print("ended writing")
            print("all_record_count: ", str(block_number))
            s3_client = boto3.client('s3')
            # s3_client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            #                          aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
            s3_client.upload_file(local_download_file, bucket_name, s3_file_path)

            # with open(local_download_file, "rb") as csv_file:
            #     encoded_string = base64.b64encode(csv_file.read())
            # os.remove(local_download_file)
            cur.close()
            conn.commit()

        except:

            print(traceback.format_exc())
            print(sys.exc_info())
            # import pdb
            # pdb.set_trace()
            conn.rollback()
            return Response({"details":sys.exc_info()}, status=400)
        return Response({"state": "downloaded", 'down_file_path': s3_file_path, 'bucket_name':bucket_name})


class PreviewRedSQL(generics.CreateAPIView):
    queryset = RedShiftDb.objects.all()
    serializer_class = RedshiftDbSerializer

    def post(self, request):
        r_user = request.user
        bundle_id = request.data.get('bundle_id')
        if bundle_id == '' or bundle_id is None:
            conn, message = get_redshit_connection_by_user(r_user.username)
        else:
            loader = Loader.objects.get(bundle_id=bundle_id)
            conn, message = get_redshit_connection(loader.settings.redshift_id)
        query = request.data.get('query')
        if loader is None and loader.settings is None:
            return Response()
        if loader.settings.redshift_id is None:
            return Response()
        transformfilter = TransformFilter.objects.get(bundle_id=bundle_id)
        if transformfilter is None:
            return Response()
        if not conn:
            return Response()

        headers = []
        header_query=''
        start_point = str.upper(query).find('SELECT')+6
        end_point = str.upper(query).find('FROM')-1
        header_from_sql = query[start_point: end_point]
        cur = conn.cursor()
        if '*' in header_from_sql:
            if 'COUNT(*)' in str(header_from_sql).upper():
                headers.append('COUNT')
            else:
                header_query = """SELECT column_name FROM information_schema.columns WHERE TABLE_NAME='""" + str(loader.settings.table_name).lower() + """' AND TABLE_SCHEMA='""" + loader.settings.schema + """'"""
                try:
                    cur.execute(header_query)
                    headers = [col[0] for col in cur.fetchall()]
                except:
                    print(traceback.format_exc())
                    print(sys.exc_info())
                    conn.rollback()
                    return Response({"details": sys.exc_info()}, status=400)
                headers_string = str(headers)
                headers_string = headers_string.replace("[", "")
                headers_string = headers_string.replace("]", "")
                headers_string = headers_string.replace("\\", "")
                headers_string = headers_string.replace("'", '"')
                p_select_last = str(query).upper().find('SELECT') + 6
                p_from_start = str(query).upper().find('FROM')
                q1 = query[:p_select_last]
                q2 = query[p_from_start:]
                query = q1 + " " + headers_string + " " + q2
        else:
            header_from_sql = header_from_sql.replace(' ', '')
            headers = str(header_from_sql).split(',')

        if query == '':
            return Response()
        try:
            cur.execute(query)
            rows = cur.fetchall()
            local_download_file = 'transformed_files/sample_' + bundle_id + ".csv"
            with open(local_download_file, 'w') as fp:
                csvw = csv.writer(fp)
                csvw.writerows(rows)
            cur.close()
            conn.commit()
        except:
            print(traceback.format_exc())
            print(sys.exc_info())
            # import pdb
            # pdb.set_trace()
            conn.rollback()
            return Response({"details":sys.exc_info()}, status=400)

        raw_lines = []
        csv_line_spliter = '\n'
        with open(local_download_file, newline=csv_line_spliter) as rawfile:
            csv_lines = csv.reader(rawfile, delimiter=',', quotechar='"', skipinitialspace=True)
            for line in csv_lines:
                new_line=[]
                for col in line:
                    new_line.append(col)
                raw_lines.append(new_line)
        os.remove(local_download_file)
        return Response({"state": "success", 'sql_result': raw_lines, 'table_headers': headers})
