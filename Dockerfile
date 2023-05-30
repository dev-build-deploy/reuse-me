# SPDX-FileCopyrightText: 2023 Kevin de Jong <monkaii@hotmail.com>
#
# SPDX-License-Identifier: CC0-1.0

FROM node:18-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
CMD [ "npm", "start" ]
