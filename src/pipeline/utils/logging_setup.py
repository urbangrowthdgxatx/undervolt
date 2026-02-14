"""Logging configuration"""
import logging


def setup_logging(name="permits", level=logging.INFO):
    """Setup logging configuration"""
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[logging.StreamHandler()]
    )
    return logging.getLogger(name)
