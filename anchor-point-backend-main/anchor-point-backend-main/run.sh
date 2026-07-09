#!/bin/bash
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=postgres
export ENV=dev
export JWT_SECRET_KEY=secret
export JWT_ALGORITHM=HS256
export FIREBASE_JSON='{
  "type": "service_account",
  "project_id": "dummy",
  "private_key_id": "dummy",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCvEij0giEbbMEr\nKQMLOjvec5uqSEziiiilnUh2bB/2NYs/gJiolM9Ge0k7PFDPgQoRbZKmODd3Y3QF\ng3HCD30cXEWSglXkWKma0yTxx4A2ymT8iqWPM6TdT+WwRXfYQbklVn57ncI9UDKI\n6NtcefxIeBww5geV2ETy89CUaKezDBbaw3M/K2xmF9SkMe03O2+uhWOIFBYAjWdP\nw1BI7NEkKApNH3CV5bUzFswrj7Ykvu05fmvYx5nIIWMFkiukDujsz2txr20OqLMF\nKne4R7+L1sUuA+EEGKowXWxHX0AIoq6jeLM36R9gq7mzckXkjwQE9xmdzqjEI7et\nppVGQ+4xAgMBAAECggEAAx9DCTc/4WYTXNJuqjbX5fvwUP1Yl6qolmmDZw8/E6w5\nR0DjGBCNUL+2mt6Uv1qZBB4M4Td7775fjZCeSPxvOgAAQqBd6URWg/sTe9dXt0Jt\nQh6z3KWqYUMBQN9AR6RGab7M4yX5VpAVUqE6dj/7qowvzoRvqrGwaxfDhr4GDZiY\nS10uVGM0+DkOHY+kF93EDuRhh1vDp1iUVA0HyGmiNq+WNHPr/N7/7WotPNWVe2fb\nEZyDZhbl5Sg6pyW3FPeAAMDnXTk8KPq81yQUEf3Xe9fx6y1Ki7TRZ9xjcsjC5uZv\ndQae2KgihUPPd1w7izbe+8+aupUWd+yOEbRdcTiYtQKBgQDXx5KloVdkqQ0Lou8l\nRwovs3Lpf4P2dUFxYaBob2fTvBRh/rCFqpTAjU+qGhNT8PqgYfoJK5LgolSzzJZP\nyr5knEtNZHMm8no0ZDIHpVThD/tu8dr/7/SzZOun0E4G/OROXrLpwdw+CfV3oAcN\nWPz0oHfo12ZAqDAqOfCQXiIWPQKBgQDPtBQ7LMwDC2W4mz4lvUwLNn/ZNSCvbXTh\n6h13VOkd+R+QbDHRuHKROSrRBaRl7ZnP/2sxpPtWu6YQ4rZDof1YEXQoGXrVpGP6\nr3HZCEo3NUmemaSIJme7SW+ebJ335tEUi4EzlCwN4UpG23dJ+GVjTH4yNm5PPu/+\nozOo5GZrBQKBgQDPvhy5yfPRvdAJe/yx7wsnkaT4mQP7rDgtaMh+w4M6nsEg94wL\npIdCOsqQAjrJfiBNeQa4/XKTQrY5xKaSe6eCRddZ03Pp81kkR7LDGbH2XOS9k6w8\n7FCyxl77WdlFcQR9Tz8BPttD/2KMoU0o1Jv1COlpCrgvV73HabDpzTcUIQKBgQCJ\nGhlwpjVUnSVcIj13s+iKTkM+IW+d3OaWaW9h4c6vVk6bio+oG9SkP9QffVXzYk9x\nmOwtLPYrXlpUMxKUukz84SiHf6oxc/367+x6kppKrwYVht2wcYlvex4OuSvdA6Nn\nqF50qY4a62eYNi4bybdDQK7cfkl6TdUlhJ0JExr38QKBgQCk0Ex42A7s5d/0HOct\nyf5YjVU333cDBKE2/KmQ4qXIbo4en6XOdWARHlZfRJjjZobfzqbQ/f1bTSUatk68\n6tCZjSB30iHHE9PE6ssGDYT/suiITEXEC3A3qT6uTuML8OQD3I1DVXx8ka0DIfTS\nWKJbShlc2xmBtuROFd2SU+uprQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "dummy@dummy.iam.gserviceaccount.com",
  "client_id": "dummy",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dummy"
}'
export OTP_SECRET_KEY=dummy
export CONTACT_SUPPORT=dummy
export SMS_FROM=dummy
export PYTHONPATH=$(pwd)/src

# Start Postgres DB
pg_ctl -D local_pgdata start || true

# Virtual Environment
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
    source venv/bin/activate
    pip install poetry==1.4.2
    poetry install
else
    source venv/bin/activate
fi

# Migrations
poetry run alembic -c src/migrations/alembic.ini upgrade head

# Start app
cd src
poetry run python app.py
