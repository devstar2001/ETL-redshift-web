Instructions


Before Setup
- open port 80, 8000
- Edit the file backend/django_project/settings.py,  Search for CORS_ORIGIN_WHITELIST & replace the url.
  'http://localhost:8000'
- In the file frontend/app/app.constant.ts, replace the public static API_ENDPOINT.
  API_ENDPOINT='http://localhost:8000'

Setup 
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