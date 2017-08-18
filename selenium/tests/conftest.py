import logging
import sys
import time

import pytest

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

logger = logging.getLogger(__name__)

logging.basicConfig(format="%(asctime)s.%(msecs)03d %(levelname)s %(name)s %(threadName)s: %(message)s",
                    datefmt="%Y-%m-%dT%H:%M:%S",
                    level=logging.INFO,
                    stream=sys.stdout)


def pytest_addoption(parser):
    parser.addoption('--remote', action='store', default=None,
                     help='IP or hostname of selenium webdriver server')
    parser.addoption("--browser", action="store", default=None,
                     help='The name of the browser mapping to selenium image')


@pytest.fixture
def driver(request):
    remote = request.config.getoption("--remote")
    browser = request.config.getoption("--browser")

    logger.info('Selenium remote is %s', remote)
    logger.info('Test with platform %s', browser)

    if 'chrome' in browser.lower():
        dc_browser = DesiredCapabilities.CHROME
    elif 'firefox' in browser.lower():
        dc_browser = DesiredCapabilities.FIREFOX
    else:
        raise NotImplementedError
    retries = 20
    while retries:
        try:
            selenium_driver = webdriver.Remote(command_executor='http://{}:4444/wd/hub'.format(remote),
                                               desired_capabilities=dc_browser)
            break
        except Exception as exc:
            logger.warn(exc)
            logger.info('Retry for Selenium webdriver')
            time.sleep(5)
            retries -= 1

    yield selenium_driver
    selenium_driver.close()

@pytest.mark.hookwrapper
def pytest_runtest_makereport(item, call):
    driver = item.funcargs['driver']
    pytest_html = item.config.pluginmanager.getplugin('html')
    outcome = yield
    report = outcome.get_result()
    extra = getattr(report, 'extra', [])
    if report.when == 'call':
        xfail = hasattr(report, 'wasxfail')
        if (report.skipped and xfail) or (report.failed and not xfail):
            screenshot = driver.get_screenshot_as_base64()
            extra.append(pytest_html.extras.image(screenshot, ''))
            report.extra = extra
