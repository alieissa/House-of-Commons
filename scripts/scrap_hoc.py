
from bs4 import BeautifulSoup
from lxml import html
import csv
import requests

def get_mp_coordinates():
    mps = {}

    seating_plan_url ="http://www.parl.gc.ca/parliamentarians/en/floorplan"
    page = requests.get(seating_plan_url)
    page.raise_for_status() #raise if request not successful

    hoc = BeautifulSoup(page.text, "lxml")
    seating_table = hoc.find_all('table', class_='FloorPlan')
    seating_table_rows = hoc.find_all('tr', class_="FloorPlanRow");

    for rindex, row in enumerate(seating_table_rows):
        for cindex, cell in enumerate(row.find_all('td')):
            mp = {}
            mp['row'] = rindex
            mp['column'] = cindex

            try:
                name_array = cell.attrs['title'].split(" ")

                if(name_array[0] == "Right"): # Right Hon. Justin Trudea
                    mp['name'] = 'Justin Trudeau'
                elif(name_array[0] == "Hon."):
                    mp['name'] = " ".join(cell.attrs['title'].split(" ")[1:])
                else:
                    mp['name'] = cell.attrs['title']

                mp['name'] = mp['name'].encode('utf8')
                mp['gender'] = cell.attrs['gender']
            except KeyError:
                try:
                    mp['name'] = cell['class'][0]
                except:
                    mp['name'] = 'Separator'
                mp['gender'] = "NA"
            mps[mp['name']] = mp
    return mps


def save_mps(file, mps):
    mps_file = open('../mps0.csv', 'r') #file without mp gender, row, and column
    data = open(file, 'wr') # file with mps

    rdata = csv.reader(mps_file)
    rdata.next() #skip header row

    mps_writer = csv.writer(data)

    for mp in rdata:
        fullname = " ".join(mp[0:2]) #put in same format as found on house of commons css code
        mp_data = mps[fullname]
        mp.append(mp_data['gender'])
        mp.append(mp_data['row'])
        mp.append(mp_data['column'])
        print mp
        mps_writer.writerow(mp);

    data.close()
    mps_file.close()

mps = get_mp_coordinates()
save_mps('mps_t.csv', mps)
