#! /usr/bin/env python

import argparse
import csv
import logging
import os
import sys
import zipfile

import pymongo
import requests

from concurrent.futures import as_completed, ThreadPoolExecutor

MLBDB = 'MLB'
logger = logging.getLogger(__name__)


URLS = {'2016': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/baseballdatabank-2017.1.zip',
        '2015': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/baseballdatabank-master2016.zip',
        '2014': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/lahman-csv_2014-02-14.zip',
        '2013': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/lahman-csv_2015-01-24.zip',
        '2012': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/lahman2012-csv.zip',
        '2011': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/lahman591-csv.zip',
        '2010': 'https://s3-us-west-1.amazonaws.com/ax-public/mlb-db/lahman58-csv.zip'
        }


class MLBLoader(object):

    def __init__(self, db, year, port=27017):
        """
        :param dbhost:
        :param year:
        :param port:
        :return:
        """
        client = pymongo.MongoClient(db, port=port)
        self.db_client = client[MLBDB]
        self.year = str(year)
        logger.info(db)
        
    def run(self):
        """
        :return:
        """
        csv_files = self.download_csv_file()

        with ThreadPoolExecutor(max_workers=4) as executor:
            all_futures = [executor.submit(self.load_csv_to_db, csv_file)
                           for csv_file in csv_files]
            for future in as_completed(all_futures):
                try:
                    future.result()
                except Exception as exc:
                    logger.warn('Got an exception: %s', exc)
                    raise
        logger.info('Complete: Successfully load data to DB')

    def download_csv_file(self):
        """
        :return:
        """
        csv_files = []
        url = URLS.get(self.year)
        zipped = '/tmp/tmp.zip'
        unzipped = '/tmp/unzipped'

        logger.info('Downloading year %s data from "%s"', self.year, url)
        with open(zipped, "wb") as f:
            response = requests.get(url)
            f.write(response.content)
        zipfile.ZipFile(zipped).extractall(unzipped)
        if os.path.exists(zipped):
            os.remove(zipped)
        for root, dirs, files in os.walk(unzipped):
            for f in files:
                if f.endswith('.csv'):
                    csv_files.append(os.path.join(root, f))
        return csv_files

    def load_csv_to_db(self, csv_file):
        """
        :param csv_file:
        :return:
        """
        csv_name = os.path.splitext(os.path.basename(csv_file))[0].lower()

        valid = ['fielding', 'master', 'pitching', 'batting', 'teams', 'teamsfranchises', 'halloffame']
        if csv_name not in valid:
            return

        if csv_name == 'teamsfranchises':
            csv_name = 'franchises'
        elif csv_name == 'halloffame':
            csv_name = 'hof'
        elif csv_name == 'master':
            csv_name = 'players'

        collections = self.db_client[csv_name]
        logger.info('Loading %s data to DB', csv_name)
        with open(csv_file) as csvfile:
            data = []
            reader = csv.DictReader(csvfile)
            data = list(reader)
            collections.insert(data, check_keys=False)
        logger.info('Successfully load %s entries to DB', len(data))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Load MLB CSV data to Mongo database')
    parser.add_argument('--year', help='the year of data')
    parser.add_argument('--db', help='the hostname of the database')

    logging.basicConfig(format='%(asctime)s.%(msecs)03d %(levelname)s %(name)s %(threadName)s: %(message)s',
                        datefmt='%Y-%m-%dT%H:%M:%S',
                        level=logging.INFO,
                        stream=sys.stdout)
    args = parser.parse_args()

    try:
        loader = MLBLoader(args.db, args.year)
        loader.run()
    except Exception as exc:
        logger.exception(exc)
        sys.exit(1)
    finally:
        sys.exit(0)
