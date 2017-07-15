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
import random
import time, threading, datetime, calendar
from uuid import uuid4


import logging, logging.handlers
import sys, os, argparse
import time

import iotUtils
import mqttConnector
import running_mode
from dataCollector import *


firstDataNotPushed=True
currentDiskRead=0
currentDiskWrite=0
currentBytesSent=0
currentBytesRecv =0

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

    cpuusage = float(iotUtils.cpuusage)
    batterypercentage = float(iotUtils.batterypercentage)
    batterypluggedin = 0
    if(iotUtils.batterypluggedin):
        batterypluggedin=1
    memoryusage=float(iotUtils.memoryusage)
    diskusage=float(iotUtils.diskusage)
    diskreads=float(iotUtils.diskreads)
    diskwrites=float(iotUtils.diskwrites)
    diskreadcount=float(iotUtils.diskreadcount)
    diskwritecount=float(iotUtils.diskwritecount)
    bytessent=float(iotUtils.bytessent)
    bytesrecv=float(iotUtils.bytesrecv)

    global firstDataNotPushed
    global currentBytesRecv
    global currentBytesSent
    global currentDiskRead
    global currentDiskWrite

    if(firstDataNotPushed):
        currentBytesSent = bytessent
        bytessent=0
        currentBytesRecv = bytesrecv
        bytesrecv=0
        currentDiskWrite = diskwrites
        diskwrites=0
        currentDiskRead = diskreads
        diskreads  =0
        firstDataNotPushed = False
    else :
        bytessent = bytessent - currentBytesSent
        currentBytesSent = currentBytesSent + bytessent
        bytesrecv = bytesrecv - currentBytesRecv
        currentBytesRecv = currentBytesRecv + bytesrecv
        diskreads = diskreads - currentDiskRead
        currentDiskRead = currentDiskRead - diskreads
        diskwrites = diskwrites -  currentDiskWrite
        currentDiskWrite = currentDiskWrite + diskwrites

    PUSH_DATA = iotUtils.DEVICE_INFO.format(currentTime, cpuusage,batterypercentage,batterypluggedin,memoryusage,diskusage,diskreads,diskwrites,diskreadcount,diskwritecount,bytessent,bytesrecv)

    print '~~~~~~~~~~~~~~~~~~~~~~~~ Publishing Device-Data ~~~~~~~~~~~~~~~~~~~~~~~~~'
    print ('PUBLISHED DATA: ' + PUSH_DATA)
    print ('PUBLISHED TOPIC: ' + mqttConnector.TOPIC_TO_PUBLISH)

    # error in publishing data
    mqttConnector.publish(PUSH_DATA)

'''
cpuusage
batterypercentage
batterypluggedin
memoryusage
diskusage
diskreads
diskwrites
diskreadcount
diskwritecount
bytessent
bytesrecv

'''

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#           Collect Data
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def collectData():

    iotUtils.cpuusage = getCpuUsage()
    iotUtils.batterypercentage = getBatteryPercentage()
    iotUtils.batterypluggedin = getBatteryPluggedin()
    iotUtils.memoryusage = getMemoryUsage()
    iotUtils.diskusage = getDisksUsage()
    iotUtils.diskreads = getDiskReads()
    iotUtils.diskwrites = getDiskWrites()
    iotUtils.diskreadcount = getDiskReadCount()
    iotUtils.diskwritecount = getDiskWriteCount()
    iotUtils.bytessent = getBytesSent()
    iotUtils.bytesrecv = getBytesRecv()

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#           Generate Random Values
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
def generateRandoms():
    iotUtils.BATTERY_STATUS = random.randrange(-1, 2)
    iotUtils.BATTERY_LEVEL = random.randrange(20, 100)
    iotUtils.CPU_USAGE = random.randrange(20, 100)
    iotUtils.MEMORY_SPACE = random.randrange(10, 70)
    iotUtils.DISK_SPACE = random.randrange(10, 70)
    iotUtils.LOAD_AVERAGE = random.randrange(0, 1)

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


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


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       This is a Thread object for reading data continuously
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
class DataReaderThread(object):
    def __init__(self):
        if running_mode.RUNNING_MODE == 'N':
            self.interval = iotUtils.DATA_READING_INTERVAL_REAL_MODE
        else:
            self.interval = iotUtils.DATA_READING_INTERVAL_VIRTUAL_MODE
        thread = threading.Thread(target=self.run, args=())
        thread.daemon = True  # Daemonize thread
        thread.start()  # Start the execution

    def run(self):

        # Try to grab a sensor reading.  Use the read_retry method which will retry up
        # to 15 times to get a sensor reading (waiting 2 seconds between each retry).
        while True:
            try:

                if running_mode.RUNNING_MODE == 'N':
                    # time.sleep(PUSH_INTERVAL)
                    collectData()
                    time.sleep(15)
                else:
                    # generate random values
                    generateRandoms()

                #print "############ DATA READINGS ###############"
                #print 'BATTERY LEVEL : ' + str(iotUtils.BATTERY_LEVEL)
                #print 'BATTERY STATUS : ' + str(iotUtils.BATTERY_STATUS)
                #print 'CPU USAGE : ' + str(iotUtils.CPU_USAGE)
                #print 'MEMORY SPACE : ' + str(iotUtils.MEMORY_SPACE)
                #print 'DISK SPACE : ' + str(iotUtils.DISK_SPACE)
                #print 'LOAD AVERAGE:' + str(iotUtils.LOAD_AVERAGE)
                #print "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
                print " "

            except Exception, e:
                print '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
                print "LINUX LAPTOP STATUS : Exception in TempReaderThread: Could not successfully read Data"
                print ("LINUX_LAPTOP_STATS: " + str(e))
                pass
                time.sleep(self.interval)
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#       The Main method of the RPi Agent
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

def main():
    configureLogger("WSO2IOT_RPiStats")
    UtilsThread()
    # registerDeviceIP()  # Call the register endpoint and register Device IP
    # ListenHTTPServerThread()  # starts an HTTP Server that listens for operational commands to switch ON/OFF Led
    SubscribeToMQTTQueue()  # connects and subscribes to an MQTT Queue that receives MQTT commands from the server
    DataReaderThread()  # initiates and runs the thread to continuously read temperature from DHT Sensor

    # test

    time.sleep(10)
    while True:
        connectAndPushData()  # Push Sensor (Temperature) data to WSO2 BAM
        time.sleep(15)

if __name__ == "__main__":
    main()
