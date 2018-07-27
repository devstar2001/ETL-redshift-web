from django.conf import settings
from celery import shared_task, current_task
import logging
from datetime import datetime
import PyPDF2
import tabula
import pandas as pd
import boto3
from boto3.s3.transfer import S3Transfer
import os, sys
from django_project.celery import app
from celery.utils.log import get_task_logger, get_logger
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import requests
import datetime
import json
from bs4 import BeautifulSoup
import pandas as pd


logger = get_task_logger(__name__)

app.control.purge()


def make_context(page_number, process_percent, started_time, current_time, task_id):
    context = {
        'process_page': page_number,
        'process_percent': process_percent,
        'started_time': started_time,
        'current_time': current_time,
        'task_id': task_id
    }
    return context


@shared_task
def convert_pdftask(bucket_name, source_path, filename, username, start_page_number, end_page_number,del_row_str, rename_headers, split_headers):

    logger.info("task_name:{0}, task_id:{1}, username:{2}, filename:{3}".format("convert_pdftask",
                                                                                      current_task.request.id, username,
                                                                                      filename))
    task_id = current_task.request.id
    del_row_str = del_row_str or None
    started_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    filename_ext = filename[-4:]
    state = "STARTED"
    page_number = 0
    process_percent = 0

    if not filename_ext == ".pdf":
        state = "No file type is PDF."
        current_task.update_state(state=state, meta=make_context(page_number, process_percent, started_time, current_time, task_id))
        return state

    filename_prefix = filename[:-4]
    filename_path = "uploaded_files" + "/" + username + "/" + filename
    if not os.path.exists(filename_path):
        state = 'No file exist.'
        current_task.update_state(state=state, meta=make_context(page_number, process_percent, started_time, current_time, task_id))
        return state
    
    pfr = PyPDF2.PdfFileReader(open(filename_path, "rb"))  # PdfFileReader object
    # pageCounts = end_page_number
    pageCounts = pfr.getNumPages()
    if end_page_number > pageCounts:
        end_page_number = pageCounts
    start_page_number = start_page_number or 1
    df_result = pd.DataFrame()
    df_page = pd.DataFrame()

    for page_number in range(start_page_number, end_page_number + 1):
        df_first = tabula.read_pdf(filename_path, pages=page_number)
        if page_number == pageCounts:
            if "Total Tax" in df_first:
                df_first = df_first.rename(
                    columns={"Total Tax": "empty col"})
                df_first = df_first.rename(
                    columns={"Unnamed: 5": "Total Tax"})
        columns_df_first = list(df_first)
        df_first = df_first.dropna(axis=0, how='all')
        df_first = df_first.reset_index(drop=True)
        if not del_row_str is None:
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
                        df_temp = pd.DataFrame(df_first[col].str.split(' ', expand=True, n=1)).rename(
                            columns={0: col_child_names[0],
                                     1: col_child_names[1]})
                    df_page[col_child_names] = df_temp

                col_child_count = 0
                col_child_names = []

            df_result = df_result.append(df_page)
            df_result = df_result.dropna(axis=0, how='all')
            df_result = df_result.reset_index(drop=True)
            rows = df_page.count(axis=0).values[0]
            rows_result = df_result.count(axis=0).values[0]
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            process_percent = int(100 * float(page_number) / float(end_page_number))
            
            current_task.update_state(state='PROGRESS', meta=make_context(page_number, process_percent, started_time, current_time, task_id))

            print("----- successful! page number: " + str(page_number) + "----------")
            print("entire row counts : " + str(rows_result))
            print("appended row counts : " + str(rows))
            print("current time : " + current_time)
            print(make_context(page_number, process_percent, started_time, current_time, task_id))
        except Exception as exc:
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print("-------failed! page number: " + str(page_number) + "----------")
            print("This page discovered error following : " + str(exc))
            print(make_context(page_number, process_percent, started_time, current_time, task_id))

            current_task.update_state(state='FAILED', meta=make_context(page_number, process_percent, started_time, current_time,task_id))
            return "FAILED"
    df_all = pd.DataFrame()
    for c in split_headers:
        if c in df_result:
            df_all[c] = df_result[c]
    render_filename = filename_prefix + "("+str(start_page_number)+"_"+str(end_page_number)+"pdf)" + ".csv"
    full_filename = "uploaded_files/" + username + "/" + render_filename
    df_all.to_csv(full_filename, sep=',', encoding='utf-8', index=False)


    s3 = boto3.resource('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
    s3_file_path = source_path + render_filename
    s3.meta.client.upload_file(full_filename, bucket_name, s3_file_path)
    print(full_filename)
    print(bucket_name)
    print(s3_file_path)
    state = "COMPLETED"

    current_task.update_state(state=state, meta=make_context(page_number, process_percent, started_time, current_time, task_id))

    # sys.exit()
    # app.control.purge()
    # app.control.revoke(task_id, terminate=True, signal='SIGKILL')
    return state


def try_parse_url(url):
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')  # Last I checked this was necessary.
        # linux os
    CHROMEDRIVER_PATH = os.getcwd() + '/chromedriver'
    browser = webdriver.Chrome(CHROMEDRIVER_PATH, chrome_options=chrome_options,  service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])

    # windows os
    # CHROMEDRIVER_PATH = os.getcwd() + '/chromedriver.exe'
    # browser = webdriver.Chrome(CHROMEDRIVER_PATH, chrome_options=chrome_options,
    #                            service_args=['--verbose', '--log-path=' + os.getcwd() + '/chromedriver.log'])  # windows
    print(CHROMEDRIVER_PATH)

    browser.get(url)
    browser.implicitly_wait(5)
    soup = BeautifulSoup(browser.page_source, 'lxml')
    # browser.get_screenshot_as_file('main-page.png')
    browser.close()
    return [parse_html_table(table) for table in soup.find_all('table')]


def parse_html_table(table):
    n_columns = 0
    n_rows = 0
    column_names = []
    is_header = False
    header_found = False
    is_regular_table = False
    thead = None
    if table.find_all('thead'):
        thead = table.find_all('thead')[0]
        thead_trs = thead.find_all('tr')

    tbody = None
    if table.find_all('tbody'):
        tbody = table.find_all('tbody')[0]

        for row in tbody.find_all('tr'):
            td_tags = row.find_all(['td', 'th'])
            if len(td_tags) > 0:
                n_rows += 1
                if n_columns == 0:
                    # Set the number of columns for our table
                    n_columns = len(td_tags)
                else:
                    if n_columns == len(td_tags):
                        is_regular_table = True
                    else:
                        is_regular_table = False

            if not thead is None and not header_found:
                for tr in thead_trs:
                    try:
                        th_tags = tr.find_all('th')
                    except Exception as e:
                        th_tags = None
                    if len(th_tags) == n_columns:
                        is_regular_table = True
                        for th in th_tags:
                            column_names.append(th.get_text().replace("\t", " ").replace("\n", " "))
                        header_found = True
                        is_header = True
                    else:
                        is_regular_table = False

        if not n_rows > 2:
            return (pd.DataFrame(), False)

    else:
        return (pd.DataFrame(), False)

    if not is_regular_table:
        n_rows = 0
        max_value_count = 0
        for tr in tbody.find_all('tr'):
            th_td_tags = tr.find_all(['th', 'td'])
            col_count = len(th_td_tags)
            value_count = 0
            for th_td_tag in th_td_tags:
                disp = th_td_tag.get_text().strip(' \t\n\r')
                disp = disp.strip()

                if disp != '$' and len(disp) != 0 and disp != '&nbsp;' and disp != ' ':
                    # print(disp)
                    value_count = value_count + 1
                else:
                    th_td_tag.extract()

            if value_count > max_value_count:
                max_value_count = value_count
            if value_count == 0:
                tr.extract()
            else:
                n_rows = n_rows + 1
        n_columns = max_value_count
        # print(str(max_value_count))

    # Safeguard on Column Titles
    if len(column_names) != n_columns or len(column_names) == 0:
        columns = range(0, n_columns)
    else:
        columns = column_names

    # making unique column list if column name is equal
    for i in range(len(columns)):
        column = columns[i]
        cnt = columns.count(column)
        if cnt != 1:
            start_pos = i
            for c in range(cnt):
                pos = columns.index(column, start_pos)
                if c != 0:
                    columns[pos] = column + "_" + str(c)
                start_pos = pos

    df = pd.DataFrame(columns=columns, index=range(0, n_rows))
    row_marker = 0
    for row in tbody.find_all('tr'):
        column_marker = 0
        columns = row.find_all(['td', 'th'])
        for column in columns:
            if column.findAll('span', {'class': lambda x: x and 'mobileRowValue' in x.split()}):
                column = column.findAll('span', {'class': lambda x: x and 'mobileRowValue' in x.split()})[0]
                data = column.get_text()
                df.iat[row_marker, column_marker] = data.replace("\n", " ")
                column_marker += 1
            else:
                data = column.get_text()
                df.iat[row_marker, column_marker] = data.replace("\n", " ")
                column_marker += 1
        if len(columns) > 0:
            row_marker += 1

    # Convert to float if possible
    for col in df:
        try:
            df[col] = df[col].astype(float)
        except ValueError:
            pass

    return (df, is_header)



@shared_task
def parse_upload_task(scraper_id, url, source_path, bucket_name, table_indexs_json):
    try:
        scraper = Scraper.objects.get(id=scraper_id)
    except Scraper.DoesNotExist:
        scraper = None

    if source_path == "/":
        source_path = ""
    print("******START SCRAPER TASK scraper name : " + str(scraper.name) + "*********")
    print("**scrape site: " + url)
    table_indexs = json.loads(table_indexs_json)
    if "http://" in url:
        csv_filename_prefix = url.split("http://")[1]

    if "https://" in url:
        csv_filename_prefix = url.split("https://")[1]

    csv_filename_prefix = csv_filename_prefix.split("/")[0]

    client = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                          aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)

    transfer = S3Transfer(client)
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-gpu')  # Last I checked this was necessary.

    # CHROMEDRIVER_PATH = os.getcwd() + '/chromedriver.exe'  # windows os
    CHROMEDRIVER_PATH = os.getcwd() + '/chromedriver'         #linux os
    print("chromdirver_path : " + CHROMEDRIVER_PATH)
    browser = webdriver.Chrome(CHROMEDRIVER_PATH, chrome_options=chrome_options,  service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])
    # browser = webdriver.Chrome(CHROMEDRIVER_PATH, chrome_options=chrome_options,
    #                            service_args=['--verbose', '--log-path=' + os.getcwd() + '/chromedriver.log'])  # windows

    browser.get(url)
    browser.implicitly_wait(3)
    soup = BeautifulSoup(browser.page_source, 'lxml')
    # browser.get_screenshot_as_file('main-page.png')
    browser.close()
    df_data_items = [parse_html_table(table) for table in soup.find_all('table')]

    index = 0
    filenames = []
    # directory_path = "media/"
    # strdate = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M")
    for df_data_item in df_data_items:
        df_table = df_data_item[0]
        is_header = df_data_item[1]
        if not df_table.empty:
            index = index + 1
            csv_filename = csv_filename_prefix + "_" + str(index) + ".csv"
            if is_header:
                df_table.to_csv("media/" + csv_filename, index=False)
                filenames.append({"name": csv_filename, "selected": False})
            else:
                df_table.to_csv("media/" + csv_filename, index=False, header=False)
                filenames.append({"name": csv_filename, "selected": False})
            print("----log 1. scraped " + str(index) + "th table----")
    upload_counts = 0
    for tn in table_indexs:
        csv_filename = csv_filename_prefix + "_" + str(tn) + ".csv"
        s3_file_path = source_path + csv_filename
        local_file_path = "media/" + csv_filename
        transfer.upload_file(local_file_path, bucket_name, s3_file_path)
        upload_counts = upload_counts + 1
        print("----log 2. uploaded " + str(upload_counts) + "th table----")
    result_string = "Completed, tables:" + str(index) + ", uploads:" + str(upload_counts) + ", time: " + str(timezone.now())


    if scraper:
        scraper.modified_date = timezone.now()
        scraper.status = 1                      # 0:ready(init),  1: success, 2: fail
        scraper.status_detail = result_string
        scraper.save()
    print("**** finished *****")
    return result_string

from .models import Scraper
from django.utils import timezone