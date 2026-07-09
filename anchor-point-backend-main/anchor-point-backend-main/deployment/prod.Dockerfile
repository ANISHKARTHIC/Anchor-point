FROM python:3.10-slim-bullseye

WORKDIR /app    

RUN pip install --no-cache-dir poetry==1.4.2

COPY . .

RUN poetry install

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT [ "sh","deployment/entry_point.sh" ]
