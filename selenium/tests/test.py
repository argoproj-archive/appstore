#! /usr/bin/env python

import logging
import sys
import os
import time

import pytest

logger = logging.getLogger(__name__)

logging.basicConfig(format="%(asctime)s.%(msecs)03d %(levelname)s %(name)s %(threadName)s: %(message)s",
                    datefmt="%Y-%m-%dT%H:%M:%S",
                    level=logging.INFO,
                    stream=sys.stdout)


def test_page_title(driver):
    driver.get(os.environ['APP_URL'])
    logger.info('Test page title')
    assert 'Example' in driver.title
    time.sleep(5)

    driver.find_element_by_css_selector('#myBtn').click()
    time.sleep(5)

    logger.info('Test Pass')

def test_page_title_fail(driver):
    driver.get(os.environ['APP_URL'])
    logger.info('Test page title')
    time.sleep(5)
    if os.environ['TEST_FAILURE'] == 'true':
        assert 'Error' in driver.title
    else:
        assert 'Example' in driver.title
