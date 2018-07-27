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

