from __future__ import absolute_import

import six
from datetime import timedelta
from django.utils import timezone

from sentry.models import SnubaEvent
from sentry.testutils import TestCase, SnubaTestCase
from sentry.eventstore.snuba.backend import SnubaEventStorage


class SnubaEventStorageTest(TestCase, SnubaTestCase):
    def setUp(self):
        super(SnubaEventStorageTest, self).setUp()
        min_ago = (timezone.now() - timedelta(minutes=1)).isoformat()[:19]
        two_min_ago = (timezone.now() - timedelta(minutes=2)).isoformat()[:19]
        self.project1 = self.create_project()
        self.project2 = self.create_project()
        self.event1 = self.store_event(
            data={
                'event_id': 'a' * 32,
                'type': 'default',
                'platform': 'python',
                'fingerprint': ['group1'],
                'timestamp': two_min_ago,
            },
            project_id=self.project1.id,
        )
        self.event2 = self.store_event(
            data={
                'event_id': 'b' * 32,
                'type': 'default',
                'platform': 'python',
                'fingerprint': ['group1'],
                'timestamp': min_ago,
            },
            project_id=self.project2.id,
        )
        self.event3 = self.store_event(
            data={
                'event_id': 'c' * 32,
                'type': 'default',
                'platform': 'python',
                'fingerprint': ['group2'],
                'timestamp': min_ago,
            },
            project_id=self.project2.id,
        )

        self.eventstore = SnubaEventStorage()

    def test_get_next_prev_event_id(self):

        event = SnubaEvent.objects.from_event_id('b' * 32, self.project2.id)

        filter_keys = {'project_id': [self.project1.id, self.project2.id]}

        prev_event = self.eventstore.get_prev_event_id(event, filter_keys=filter_keys)

        next_event = self.eventstore.get_next_event_id(event, filter_keys=filter_keys)

        assert prev_event == (six.text_type(self.project1.id), 'a' * 32)

        # Events with the same timestamp are sorted by event_id
        assert next_event == (six.text_type(self.project2.id), 'c' * 32)

        # Returns None if no event
        assert self.eventstore.get_prev_event_id(None, filter_keys=filter_keys) is None
        assert self.eventstore.get_next_event_id(None, filter_keys=filter_keys) is None
