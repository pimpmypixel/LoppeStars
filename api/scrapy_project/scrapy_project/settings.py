# Scrapy settings for fleamarket scraper

BOT_NAME = 'scrapy_project'

SPIDER_MODULES = ['scrapy_project.spiders']
NEWSPIDER_MODULE = 'scrapy_project.spiders'

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure pipelines
ITEM_PIPELINES = {
   'scrapy_project.pipelines.SupabasePipeline': 300,
}

# AutoThrottle extension
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 60
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
AUTOTHROTTLE_DEBUG = False

# User agents
DOWNLOADER_MIDDLEWARES = {
    'scrapy_user_agents.middlewares.RandomUserAgentMiddleware': 400,
}

# Disable cookies (optional)
COOKIES_ENABLED = False

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'