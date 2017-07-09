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

import psutil
import json

def getCpuUsage():
    return psutil.cpu_percent(interval=1, percpu=False)

def getBatteryPercentage():
    return round(psutil.sensors_battery().percent,2)

def getBatteryPluggedin():
    return psutil.sensors_battery().power_plugged

def getMemoryUsage():
    return psutil.virtual_memory().percent

def getDisksUsage():
    return psutil.disk_usage('/').percent

def getDiskReads():
    return psutil.disk_io_counters().read_bytes

def getDiskWrites():
    return psutil.disk_io_counters().write_bytes

def getDiskReadCount():
    return psutil.disk_io_counters().read_count

def getDiskWriteCount():
    return psutil.disk_io_counters().write_count

def getBytesSent():
    networkData = psutil.net_io_counters(pernic=True)
    del networkData['lo']
    bytesSent = 0
    for value in networkData.items():
        bytesSent += value[1].bytes_sent
    return bytesSent

def getBytesRecv():
    networkData = psutil.net_io_counters(pernic=True)
    del networkData['lo']
    bytesRecv=0
    for value in networkData.items():
        bytesRecv+=value[1].bytes_recv
    return bytesRecv

