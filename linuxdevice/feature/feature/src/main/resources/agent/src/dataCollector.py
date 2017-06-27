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
    numCPU = psutil.cpu_count()
    cpuPercentages = psutil.cpu_percent(interval=1, percpu=True)
    CPU_usage_data = {}
    CPU_usage_data['numOfCpu'] = numCPU
    CPU_usage_data['cpuPercentages'] = cpuPercentages
    json_data = json.dumps(CPU_usage_data)
    return json_data

def getBatteryInfo():
    battery = psutil.sensors_battery()
    batteryData={}
    batteryData['percentage'] = round(battery.percent,2)
    batteryData['isPlugged'] =battery.power_plugged
    json_data = json.dumps(batteryData)
    return json_data

def getMemoryInfo():
    mem = psutil.virtual_memory()
    memoryData={}
    memoryData['used'] = round(float(mem.used)/1024/1024/1024,2)
    memoryData['percentage'] = mem.percent
    memoryData['total'] = round(float(mem.total/1024/1024/1024),2)
    json_data = json.dumps(memoryData)
    return json_data

def getDisksInfo():
    disksData={}
    diskDetails=[]
    disks = psutil.disk_partitions()
    numPartitions = len(disks)
    numDisks=0
    disksData['details'] = diskDetails
    for i in range(0,numPartitions):
        if disks[i].fstype=='ext4':
            numDisks+=1
            mountpoint = disks[i].mountpoint
            diskusage = psutil.disk_usage(mountpoint)
            temp={}
            temp['total'] = round(float(diskusage.total)/1024/1024/1024,2)
            temp['used'] = round(float(diskusage.used) / 1024 / 1024 / 1024, 2)
            temp['percentage'] = diskusage.percent
            diskDetails.append(temp)
    disksData['numOfDisks'] = numDisks
    json_data = json.dumps(disksData)
    return json_data

def getDiskIO():
    IOdata={}
    temp = psutil.disk_io_counters()
    IOdata['readCount'] = temp.read_count
    IOdata['writeCount'] = temp.write_count
    IOdata['readBytes'] = temp.read_bytes
    IOdata['writeBytes'] = temp.write_bytes
    IOdata['readTime'] = temp.read_time
    IOdata['writeTime'] = temp.write_time
    return json.dumps(IOdata)

def getNetworkData():
    networkData = psutil.net_io_counters(pernic=True)
    del networkData['lo']
    bytesSent=0
    bytesRecv=0
    packetsSent=0
    packetsRecv=0
    for value in networkData.items():
        bytesSent+=value[1].bytes_sent
        bytesRecv+=value[1].bytes_recv
        packetsSent+=value[1].packets_sent
        packetsRecv+=value[1].packets_recv
    netData={}
    netData['bytesSent']=bytesSent
    netData['bytesRecv']=bytesRecv
    netData['packetsSent']=packetsSent
    netData['packetsRecv']=packetsRecv
    return json.dumps(netData)