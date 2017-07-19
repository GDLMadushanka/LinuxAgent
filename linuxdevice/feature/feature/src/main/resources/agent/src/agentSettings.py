def init():
    global cpuusage
    cpuusage = 0
    global batterypercentage
    batterypercentage = 0
    global batterypluggedin
    batterypluggedin = 0
    global memoryusage
    memoryusage = 0
    global diskusage
    diskusage = 0
    global diskreads
    diskreads = 0
    global diskwrites
    diskwrites = 0
    global diskreadcount
    diskreadcount = 0
    global diskwritecount
    diskwritecount = 0
    global bytessent
    bytessent = 0
    global bytesrecv
    bytesrecv = 0
    global firstDataNotPushed
    firstDataNotPushed = True
    global currentDiskRead
    currentDiskRead = 0
    global currentDiskWrite
    currentDiskWrite = 0
    global currentBytesSent
    currentBytesSent = 0
    global currentBytesRecv
    currentBytesRecv = 0

