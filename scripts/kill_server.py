import os, subprocess
output = subprocess.check_output("netstat -aon", shell=True).decode()
for line in output.split('\n'):
    if ':8082 ' in line and 'LISTENING' in line:
        pid = line.strip().split()[-1]
        print(f"Killing {pid}")
        os.system(f"taskkill /F /PID {pid}")
