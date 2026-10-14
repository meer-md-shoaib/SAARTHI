import re
import glob

def http_check(line):
    http = re.findall('http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', line)
    if not http:
        return 0
    else:
        return 1

fp = glob.glob('C:/Users/phd1718011/Documents/python/*.txt',recursive=True)    
if __name__ == "__main__":
    #text = "hi this is https://www.google.com"
    for file_name in fp:
        fname = open(file_name, "r")
        print (file_name, http_check(fname.read()))
