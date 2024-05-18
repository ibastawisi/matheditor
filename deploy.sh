#!/bin/bash

#both app folders start with 'matheditor'
LIVE_DIR_PATH=~/matheditor

#add the suffixes to the app folders
BLUE_DIR=$LIVE_DIR_PATH/blue
GREEN_DIR=$LIVE_DIR_PATH/green

# set up variables to store the current live and deploying to directories
CURRENT_LIVE_NAME=false
CURRENT_LIVE_DIR=false

DEPLOYING_TO_NAME=false
DEPLOYING_TO_DIR=false
DEPLOYING_TO_PORT=false

# this checks if the green and blue apps are running
GREEN_ONLINE=$(pm2 jlist | jq -r '.[] | select(.name == "matheditor-green") | .name, .pm2_env.status' | tr -d '\n\r')
BLUE_ONLINE=$(pm2 jlist | jq -r '.[] | select(.name == "matheditor-blue") | .name, .pm2_env.status' | tr -d '\n\r')

# if blue is running, set the current live to blue and 'deploying to' is green
if [ "$BLUE_ONLINE" == "matheditor-blueonline" ]; then
    echo "Blue is running"
    CURRENT_LIVE_NAME="matheditor-blue"
    CURRENT_LIVE_DIR=$BLUE_DIR
    
    DEPLOYING_TO_NAME="matheditor-green"
    DEPLOYING_TO_PORT=3001
    DEPLOYING_TO_DIR=$GREEN_DIR
fi

# if green is running, set the current live to green and 'deploying to' is blue
if [ "$GREEN_ONLINE" == "matheditor-greenonline" ]; then
    echo "Green is running"
    CURRENT_LIVE_NAME="matheditor-green"
    CURRENT_LIVE_DIR=$GREEN_DIR
    
    DEPLOYING_TO_NAME="matheditor-blue"
    DEPLOYING_TO_PORT=3000
    DEPLOYING_TO_DIR=$BLUE_DIR
fi

# display the current live and deploying to directories
echo "Current live: $CURRENT_LIVE_NAME"
echo "Deploying to: $DEPLOYING_TO_NAME"

echo "Current live dir: $CURRENT_LIVE_DIR"
echo "Deploying to dir: $DEPLOYING_TO_DIR"

# Navigate to the deploying to directory
cd $DEPLOYING_TO_DIR || { echo 'Could not access deployment directory.' ; exit 1; }

# Pull the latest changes
# clear any changes to avoid conflicts (usually permission based)
git reset --hard || { echo 'Git reset command failed' ; exit 1; }
git pull -f origin master || { echo 'Git pull command failed' ; exit 1; }

# install the dependencies
npm ci || { echo 'npm clean install failed' ; exit 1; }
# run migrations
npx prisma migrate deploy || { echo 'Prisma migrate deploy failed' ; exit 1; }
# Build the project
npm run build || { echo 'Build failed' ; exit 1; }

# start the pm2 process
pm2 start npm --name $DEPLOYING_TO_NAME -- start -- --port=$DEPLOYING_TO_PORT || { echo 'pm2 start failed' ; exit 1; }

# add a delay to allow the server to start
sleep 5

# check if the server is running
DEPLOYMENT_ONLINE=$(pm2 jlist | jq -r '.[] | select(.name == "$DEPLOYING_TO_NAME") | .name, .pm2_env.status' | tr -d '\n\r')

if [ "$DEPLOYMENT_ONLINE" == "$DEPLOYING_TO_NAMEonline" ]; then
    echo "Deployment successful"
else
    echo "Deployment failed"
    exit 1
fi

# update process list
pm2 delete $CURRENT_LIVE_NAME
pm2 save