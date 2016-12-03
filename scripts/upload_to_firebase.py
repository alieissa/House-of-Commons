import csv
import sys
from firebase import firebase

url = "https://houseofcommons-d40a9.firebaseio.com"
path = 'mps_f.csv'

firebase = firebase.FirebaseApplication(url, None)

file = open(path, 'r')
data = csv.reader(file)
data.next() # Skip header
for datum in data:
    mp= {}
    mp['Fname'] = datum[0]
    mp['Lname'] = datum[1]
    mp['Constituency'] = datum[2]
    mp['Political Affiliation'] = datum[3]
    mp['Honorific Title'] = datum[4]
    mp['Province'] = datum[5]
    mp['Gender'] = datum[6]
    mp['Row'] = datum[7]
    mp['Column'] = datum[8]
    mp['PID'] = datum[9]
    mp['CID'] = datum[10]


    try:
        # Must specify the second argument as the user specified id
        # Else an almost useless message is thrown.
        id = mp['Fname'].replace('.', " "), mp['Lname'].replace(".", " ")
        firebase.put('/MembersOfParliament','%s %s' % id, mp)
    except:
        Error = sys.exc_info()[0]
        print "Unexpected error with", mp
        print Error
