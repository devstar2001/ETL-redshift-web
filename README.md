#Instructions


##Before Setup
- open port 80, 8000
- Edit the file backend/django_project/settings.py,  Search for CORS_ORIGIN_WHITELIST & replace the url.
  'http://localhost:8000'
- In the file frontend/app/app.constant.ts, replace the public static API_ENDPOINT.
  API_ENDPOINT='http://localhost:8000'

##Setup 
1. Install Python3.
2. Install virtualvenv by "pip install virtualenv".
3. Create a new virtual environment by "virtualenv --python=/usr/bin/python3.5 venv".
4. Goto backend folder.
5. Activate the virtual env(venv) that you have created  by "source venv/bin/activate".
6. Install all the required pacakges of python by "pip install -r /django_project/requirements.txt".
7. Run the python server with "python3 manage.py runserver 0.0.0.0:8000".
8. Run the background task by "celery -A django_project worker -l info".
9. Go in the frontend folder.
10. Install node.js & run "npm install".
11. After this, run "npm start".



#Back-end Comments

## Celery

    Used Celery for asynchronous task queue/job queue based on distributed message passing, scheduling as well.

    1.1 Installed Broker on EC2 amazon linux.
    - Reference URL

        https://gist.github.com/joshdvir/e4124a6494a6f6b8ba7e

    - Choose RabbitMQ as a Broker.

        app = Celery('django_project')
        app.conf.broker_url = 'amqp://localhost'

    - Also can use Redis.

        app.conf.broker_url = 'redis://localhost:6379/0'

    1.2 Run Celery Worker

      Worker register all celery tasks and Run with @shared_task() and @task() annotation tags

    1.2.1 requirements

    - install packages required.

            pip install celery                  # version celery==4.1.0
            pip install django-celery-results   #django-celery-results==1.0.1

    - add following in settings.py

            INSTALLED_APP = [
                ...
                'django_celery_results',
                ...
            ]

    - migrate

            python manage.py migrate django_celery_results

    1.2.2 tasks in tasks.py
    - task for  progress that convert pdf to csv.

            @shared_task
            def convert_pdftask()
            ...
            ...

    - task for scheduling that upload csv data to Amazon Redshift.

            @shared_task()
            def load_to_redshift(bundle_id, username):
            ...
            ...
    1.2.3 command for running  worker in console .

          celery -A django_project worker -l info -P eventlet

    1.3 Run Celery Beat

        celery beat is a scheduler. Emit events to worker for periodic tasks.

    1.3.1 requirements

    - install packages required.

                    pip install django-celery-beat   #django-celery-beat==1.1.1

    - add following in settings.py

                INSTALLED_APP = [
                    ...

                    'django_celery_beat',
                    ...
                    ]
    - migrate

                python manage.py migrate

    1.3.2 code snipet for scheduling tasks.

            class LoaderSchedule(generics.GenericAPIView):
                def post(self, request):
                    ...

                    try:
                        pt = loader.schedule
                    except Loader.DoesNotExist:
                        pt=None

                    if schedule_frequency=='None':
                        ...

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



   1.3.3 command for running  worker in console .

        celery -A proj beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

## Selenium

    Used Selenium and BeautifulSoup, Pandas for scrapping table data from web sites.

    Open chrome web browser as headless mode and load website , then scrape data on EC2 Amazon linux.

    2.1 install libraries.

        pip install selenium    #selenium==3.11.0
        pip install bs4         #bs4==0.0.1
        pip install pandas      #pandas==0.22.0

    2.2 install google-chrome-stable on ec2

    Reference URL like below:

            https://intoli.com/blog/installing-google-chrome-on-centos/

    Run this command for easy install

        curl https://intoli.com/install-google-chrome.sh | bash

    2.3 Download chromedriver

    Download and unzip chromedriver corresponding to the OS.

            https://sites.google.com/a/chromium.org/chromedriver/

    2.4 Use in django.

            from selenium import webdriver
            ...

            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            CHROMEDRIVER_PATH = os.getcwd() + '/chromedriver' #chromedriver.exe on windows
            browser = webdriver.Chrome(CHROMEDRIVER_PATH, chrome_options=chrome_options,  service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])
            browser.get(url)
            browser.implicitly_wait(3)
            soup = BeautifulSoup(browser.page_source, 'lxml')
            tables = soup.find_all('table')
            browser.get_screenshot_as_file('main-page.png')
            browser.close()
