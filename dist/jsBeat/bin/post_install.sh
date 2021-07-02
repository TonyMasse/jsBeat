#!/usr/bin/env bash

readonly JSBEAT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")"/../ && pwd)

readonly SERVICE_FILE="/usr/lib/systemd/system/jsbeat.service"
readonly SERVICE_LINK="/etc/systemd/system/jsbeat.service"

echo -e "jsBeat - Creating Service...\n"

if ! [ -f "$JSBEAT_ROOT/bin/start.sh" ];
then
echo -e "ERROR: $JSBEAT_ROOT/bin/start.sh not found. Exiting."
exit 42
fi

chmod +x "$JSBEAT_ROOT/bin/start.sh"

if [ -f "$SERVICE_FILE" ];
then
echo -e "$SERVICE_FILE already exist. Leaving as is."
else
echo -e "Creating $SERVICE_FILE."
cat > "$SERVICE_FILE" <<- EOM
[Unit]
Description=A light, Javascript based, Beat to collect data for the Open Collector
Documentation=https://github.com/TonyMasse/jsBeat
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=/opt/jsBeat/bin/start.sh
Restart=always
RestartSec=5
StartLimitIntervalSec=0
Type=simple

[Install]
WantedBy=multi-user.target
EOM

fi

if [ -e "$SERVICE_LINK" ];
then
echo -e "$SERVICE_LINK already exist. Leaving as is."
else
echo -e "Creating symbolic link: $SERVICE_LINK -> $SERVICE_FILE."
ln -s "$SERVICE_FILE" $SERVICE_LINK
fi
