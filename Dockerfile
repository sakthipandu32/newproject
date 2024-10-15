FROM ubuntu:20.04
WORKDIR /app
RUN apt-get update && \
    apt-get -y install \
        curl \
        gnupg \
        libfontconfig \
        gconf-service \
        libasound2 \
        libgbm-dev \
        libnss3 \
        libatk1.0-0 \
        libx11-xcb1 \
        libxcomposite1 \
        libxrandr2 \
        libxext6 \
        libgtk-3-0 \
        libatk-bridge2.0-0 \
        libgbm1
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get -y install nodejs
RUN useradd -ms /bin/bash appuser
RUN chown -R appuser:appuser /app
USER root
ADD package*.json ./
RUN npm install
RUN npm rebuild phantomjs-prebuilt
RUN npm install puppeteer --unsafe-perm=true --allow-root

COPY . .
EXPOSE 5000
CMD [ "node", "index.js"]


