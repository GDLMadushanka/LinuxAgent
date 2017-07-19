import os
try:
    import pip
except ImportError:
    os.system('python get-pip.py')

def import_or_install(package):
    try:
        __import__(package)
        print('already there')
    except ImportError:
        pip.main(['install', package])

def installMissingPackages():
    import_or_install('psutil')
    os.system('pip install -Iv paho-mqtt==1.2.3')