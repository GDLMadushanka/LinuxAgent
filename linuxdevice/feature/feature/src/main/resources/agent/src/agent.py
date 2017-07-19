#!/usr/bin/env python
"""
/**
* Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* WSO2 Inc. licenses this file to you under the Apache License,
* Version 2.0 (the "License"); you may not use this file except
* in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied. See the License for the
* specific language governing permissions and limitations
* under the License.
**/
"""

import time, threading, datetime, calendar
from uuid import uuid4


import logging, logging.handlers
import sys, os, argparse
import time

import iotUtils
import mqttConnector
import agentSettings

import importer
importer.installMissingPackages()


from dataCollector import *
agentSettings.init()



PUSH_INTERVAL = 5000  # time interval between successive data pushes in seconds

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       Logger defaults
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
LOG_FILENAME = "linuxdevice.log"
logging_enabled = False
LOG_LEVEL = logging.INFO  # Could be e.g. "DEBUG" or "WARNING"

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       This is a Thread object for listening for MQTT Messages
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

class UtilsThread(object):
    def __init__(self):
        thread = threading.Thread(target=self.run, args=())
        thread.daemon = True  # Daemonize thread
        thread.start()  # Start the execution

    def run(self):
        iotUtils.main()
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       This is a Thread object for connecting and subscribing to an MQTT Queue
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class SubscribeToMQTTQueue(object):
    def __init__(self):
        thread = threading.Thread(target=self.run, args=())
        thread.daemon = True  # Daemonize thread
        thread.start()  # Start the execution

    def run(self):
        mqttConnector.main()
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       A class we can use to capture stdout and sterr in the log
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class IOTLogger(object):
    def __init__(self, logger, level):
        """Needs a logger and a logger level."""
        self.logger = logger
        self.level = level

    def write(self, message):
        if message.rstrip() != "":  # Only log if there is a message (not just a new line)
            self.logger.log(self.level, message.rstrip())
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       Configure logging to log to a file,
#               making a new file at midnight and keeping the last 3 day's data
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def configureLogger(loggerName):
    logger = logging.getLogger(loggerName)
    logger.setLevel(LOG_LEVEL)  # Set the log level to LOG_LEVEL
    handler = logging.handlers.TimedRotatingFileHandler(LOG_FILENAME, when="midnight",
                                                        backupCount=3)  # Handler that writes to a file,
    # ~~~make new file at midnight and keep 3 backups
    formatter = logging.Formatter('%(asctime)s %(levelname)-8s %(message)s')  # Format each log message like this
    handler.setFormatter(formatter)  # Attach the formatter to the handler
    logger.addHandler(handler)  # Attach the handler to the logger

    if (logging_enabled):
        sys.stdout = IOTLogger(logger, logging.INFO)  # Replace stdout with logging to file at INFO level
        sys.stderr = IOTLogger(logger, logging.ERROR)  # Replace stderr with logging to file at ERROR level
### ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       This method connects to the Device-Cloud and pushes data
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def connectAndPushData():
    currentTime = calendar.timegm(time.gmtime())
    # rPiTemperature = iotUtils.LAST_TEMP  # Push the last read temperature value
    # PUSH_DATA = iotUtils.DEVICE_INFO.format(currentTime, rPiTemperature)

    agentSettings.cpuusage = float(agentSettings.cpuusage)
    agentSettings.batterypercentage = float(agentSettings.batterypercentage)
    agentSettings.batterypluggedin = 0
    if(agentSettings.batterypluggedin):
        agentSettings.batterypluggedin=1
    agentSettings.memoryusage=float(agentSettings.memoryusage)
    agentSettings.diskusage=float(agentSettings.diskusage)
    agentSettings.diskreads=float(agentSettings.diskreads)
    agentSettings.diskwrites=float(agentSettings.diskwrites)
    agentSettings.diskreadcount=float(agentSettings.diskreadcount)
    agentSettings.diskwritecount=float(agentSettings.diskwritecount)
    agentSettings.bytessent=float(agentSettings.bytessent)
    agentSettings.bytesrecv=float(agentSettings.bytesrecv)

    if(agentSettings.firstDataNotPushed):
        agentSettings.currentBytesSent = agentSettings.bytessent
        agentSettings.bytessent=0
        agentSettings.currentBytesRecv = agentSettings.bytesrecv
        agentSettings.bytesrecv=0
        agentSettings.currentDiskWrite = agentSettings.diskwrites
        agentSettings.diskwrites=0
        agentSettings.currentDiskRead = agentSettings.diskreads
        agentSettings.diskreads  =0
        agentSettings.firstDataNotPushed = False
    else :
        agentSettings.bytessent = agentSettings.bytessent - agentSettings.currentBytesSent
        agentSettings.currentBytesSent = agentSettings.currentBytesSent + agentSettings.bytessent
        agentSettings.bytesrecv = agentSettings.bytesrecv - agentSettings.currentBytesRecv
        agentSettings.currentBytesRecv = agentSettings.currentBytesRecv + agentSettings.bytesrecv
        agentSettings.diskreads = agentSettings.diskreads - agentSettings.currentDiskRead
        agentSettings.currentDiskRead = agentSettings.currentDiskRead - agentSettings.diskreads
        agentSettings.diskwrites = agentSettings.diskwrites -  agentSettings.currentDiskWrite
        agentSettings.currentDiskWrite = agentSettings.currentDiskWrite + agentSettings.diskwrites

    PUSH_DATA = iotUtils.DEVICE_INFO.format(currentTime, agentSettings.cpuusage,agentSettings.batterypercentage,agentSettings.batterypluggedin,agentSettings.memoryusage,agentSettings.diskusage,agentSettings.diskreads,agentSettings.diskwrites,agentSettings.diskreadcount,agentSettings.diskwritecount,agentSettings.bytessent,agentSettings.bytesrecv)

    print '~~~~~~~~~~~~~~~~~~~~~~~~ Publishing Device-Data ~~~~~~~~~~~~~~~~~~~~~~~~~'
    print ('PUBLISHED DATA: ' + PUSH_DATA)
    print ('PUBLISHED TOPIC: ' + mqttConnector.TOPIC_TO_PUBLISH)

    # error in publishing data
    mqttConnector.publish(PUSH_DATA)


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#           Collect Data
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def collectData():

    agentSettings.cpuusage = getCpuUsage()
    agentSettings.batterypercentage = getBatteryPercentage()
    agentSettings.batterypluggedin = getBatteryPluggedin()
    agentSettings.memoryusage = getMemoryUsage()
    agentSettings.diskusage = getDisksUsage()
    agentSettings.diskreads = getDiskReads()
    agentSettings.diskwrites = getDiskWrites()
    agentSettings.diskreadcount = getDiskReadCount()
    agentSettings.diskwritecount = getDiskWriteCount()
    agentSettings.bytessent = getBytesSent()
    agentSettings.bytesrecv = getBytesRecv()

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#           Replace the auth token in deviceConfig.properties file
#               generating a new one by checking the validation time period
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def replaceToken():
    # Open the file with read only permit
    f = open('deviceConfig.properties')

    # If the file is not empty keep reading line one at a time
    # till the file is empty
    line = f.readline()
    existing_line = ""
    while line:
        line = f.readline()
        # print line
        if 'auth-token=' in line:
            existing_line = line

    f.close()

    # reading from a txt file example
    fr = open('deviceConfig.properties', 'r+w')
    line = fr.read()

    #  overwrites the file with emptyness
    open('deviceConfig.properties', 'w').close()

    # generate token
    rand_token = uuid4()
    # replace the data
    fr.write(line.replace(existing_line, 'auth-token=' + str(rand_token) + '\n'))


def main():
    configureLogger("WSO2IOT_RPiStats")
    UtilsThread()
    # registerDeviceIP()  # Call the register endpoint and register Device IP
    # ListenHTTPServerThread()  # starts an HTTP Server that listens for operational commands to switch ON/OFF Led
    SubscribeToMQTTQueue()  # connects and subscribes to an MQTT Queue that receives MQTT commands from the server

    # test

    time.sleep(10)
    while True:
        collectData()
        connectAndPushData()  # Push Sensor (Temperature) data to WSO2 BAM
        time.sleep(15)

if __name__ == "__main__":
    main()
