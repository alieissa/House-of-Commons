import csv
from firebase import firebase

url = "https://houseofcommons-d40a9.firebaseio.com"
path = 'non_mps.csv'

firebase = firebase.FirebaseApplication(url, None)

file = open(path, 'r')
data = csv.reader(file)
data.next() # Skip header
for datum in data:
    nmp= {}
    nmp['name'] = datum[0]
    nmp['row'] = datum[1]
    nmp['column'] = datum[2]

    try:
        firebase.post('/NonMembersOfParliament',nmp)
    except:
        Error = sys.exc_info()[0]
        print "Unexpected error with", nmp
        print Error
