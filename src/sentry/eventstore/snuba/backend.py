from __future__ import absolute_import

from datetime import datetime
import six

from sentry.utils import snuba
from sentry.eventstore.base import EventStorage


DEFAULT_START = datetime.utcfromtimestamp(0)  # will be clamped to project retention
DEFAULT_END = datetime.utcnow()  # will be clamped to project retention


class SnubaEventStorage(EventStorage):
    """
    Eventstore backend backed by Snuba
    """

    def get_next_event_id(self, event, conditions=None, filter_keys=None):
        """
        Returns (project_id, event_id) of a next event given a current event
        and any filters/conditions. Returns None if no next event is found.
        """

        if not event:
            return None

        time_condition = [
            ['timestamp', '>=', event.timestamp],
            [['timestamp', '>', event.timestamp], ['event_id', '>', event.event_id]]
        ]

        conditions = conditions or []
        conditions.extend(time_condition)

        return self.__get_next_or_prev_event_id(
            start=event.datetime,
            end=DEFAULT_END,
            conditions=conditions,
            filter_keys=filter_keys,
            orderby=['timestamp', 'event_id']
        )

    def get_prev_event_id(self, event, conditions=None, filter_keys=None):
        """
        Returns (project_id, event_id) of a previous event given a current event
        and any filters/conditions. Returns None if no previous event is found.
        """
        if not event:
            return None

        time_condition = [
            ['timestamp', '<=', event.timestamp],
            [['timestamp', '<', event.timestamp], ['event_id', '<', event.event_id]]
        ]
        conditions = conditions or []
        conditions.extend(time_condition)

        return self.__get_next_or_prev_event_id(
            end=event.datetime,
            start=DEFAULT_START,
            conditions=conditions,
            filter_keys=filter_keys,
            orderby=['-timestamp', '-event_id']
        )

    def __get_next_or_prev_event_id(self, **kwargs):
        result = snuba.raw_query(
            selected_columns=['event_id', 'project_id'],
            limit=1,
            referrer='eventstore.get_next_or_prev_event_id',
            **kwargs
        )

        if 'error' in result or len(result['data']) == 0:
            return None

        row = result['data'][0]

        return (six.text_type(row['project_id']), six.text_type(row['event_id']))
