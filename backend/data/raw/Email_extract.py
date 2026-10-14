import re
import glob
fp = glob.glob('C:/Users/phd1718011/Documents/sms work/python/*.txt',recursive=True)

emailPattern = re.compile(("([a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`" "{|}~-]+)*(@|\sat\s)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(\.|" "\sdot\s))+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)"))
#fp = glob.glob("*.txt")
#for file_name in fp:
    #print file_name

def email_check(line):
    if emailPattern.search(line) is not None:
        return 1
    else:
        return 0
    
if __name__ == "__main__":
    for file_name in fp:
        infile = open(file_name, "r")
        text = infile.read()
        print (file_name, email_check(text))
