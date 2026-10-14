import re
import glob
phonePattern = re.compile(r'(\d{3})\D*(\d{3})\D*(\d{4})\D*(\d*)$')

def phoneNumber_check(line):
    if phonePattern.search(line) is not None:
        return 1
    else:
        return 0

fp = glob.glob('C:/Users/phd1718011/Documents/python/*.txt',recursive=True)
if __name__ =="__main__":
    #text = "hi it is 9487423000"
    for file_name in fp:
        fname = open(file_name, "r")
        print (file_name, phoneNumber_check(fname.read()))
    
